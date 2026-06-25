import { timingSafeEqual } from 'crypto';

import bcrypt from 'bcryptjs';
import { parseCookie } from 'cookie';
import undici from 'undici';

import { LoginTypeEnum } from '../../../@types/index.js';
import { hashGenerator } from '../../hashGenerator.js';
import { loginSchema } from '../validators/schemas.js';
import { noContent, ok, problem } from '../http.js';
import { validateBody } from '../validators/validate.js';
import { BaseRouter } from './BaseRouter.js';

import type { Request, Response } from 'express';


/** Options applied to the session cookie set after successful login. */
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict' as const,
    // Only set the secure flag in production; plain HTTP is acceptable in dev
    secure: process.env['NODE_ENV'] === 'production',
};

const OAUTH2_STATE_COOKIE_NAME = 'oauth2State';
const OAUTH2_STATE_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env['NODE_ENV'] === 'production',
};

/**
 * TTL for OAuth2 CSRF state tokens.
 * A state must be consumed within this window or it is rejected.
 */
const OAUTH2_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** 
 * Max concurrent pending OAuth2 states. Prevents memory exhaustion from repeated /oauth2-link calls.
 */
const OAUTH2_STATE_MAX = 200;
const OAUTH2_STATE_MAX_PER_IP = 10;


/**
 * Handles all authentication routes:
 *   POST /api/auth/session         - Username / password login
 *   DELETE /api/auth/session       - Destroy session and clear cookie
 *   GET  /api/auth/session         - Validate the current session
 *   GET  /api/auth/config          - Return the public login configuration
 *   GET  /api/auth/oauth2/callback - Handle the Discord OAuth2 redirect
 */
export class AuthRouter extends BaseRouter {
    /**
     * Short-lived state tokens issued for each OAuth2 authorization request.
     * Maps state → metadata. Consumed (deleted) after first use.
     */
    readonly #oauthStates = new Map<string, { expiresAt: number; requesterIp: string }>();

    constructor(...args: ConstructorParameters<typeof BaseRouter>) {
        super(...args);
        // Class field initializers (#oauthStates, etc.) have run by this point.
        this.registerRoutes();
    }

    protected registerRoutes(): void {
        this.router.post('/session', this.#login.bind(this));
        this.router.delete('/session', this.#logout.bind(this));
        this.router.get('/session', this.#session.bind(this));
        this.router.get('/config', this.#config.bind(this));
        this.router.post('/oauth2/authorization-url', this.#createOAuth2AuthorizationUrl.bind(this));

        if (this.bot.config.webDashboard.loginType === LoginTypeEnum.OAUTH2) {
            this.router.get('/oauth2/callback', this.#oauth2Callback.bind(this));
        }
    }


    // -------------------------------------------------------------------------
    // Route handlers
    // -------------------------------------------------------------------------

    /**
     * POST /api/auth/session
     * Body (validated by Zod): { username: string, password: string }
     * Success: 204 No Content
     */
    async #login(req: Request, res: Response): Promise<Response> {
        if (this.bot.config.webDashboard.loginType !== LoginTypeEnum.USER) {
            return problem(res, {
                status: 409,
                title: 'Credentials login unavailable',
                detail: 'The dashboard is configured to use OAuth2 login only.',
                code: 'CREDENTIALS_LOGIN_DISABLED',
            });
        }

        const userIP = req.ip ?? '';

        if (this.sessionManager.checkBlocked(userIP)) {
            this.bot.logger.api( `Blocked IP: ${userIP}, attempts to log in.`);
            return problem(res, {
                status: 429,
                title: 'Too many login attempts',
                detail: 'This IP address is temporarily blocked from creating new sessions.',
                code: 'LOGIN_BLOCKED',
            });
        }

        const cookieSessionId = this.getSessionId(req);

        // Already authenticated — refresh and succeed immediately
        if (this.sessionManager.verifyAndRefreshSession(cookieSessionId)) {
            return noContent(res);
        }

        // Validate request body with Zod
        const body = validateBody(loginSchema, req, res);
        if (!body) return res as unknown as Response;

        const { username, password } = body;
        const siteConfig = this.bot.config.webDashboard;

        const passwordMatch = await AuthRouter.#comparePassword(password, siteConfig.user.password);

        if (username === siteConfig.user.username && passwordMatch) {
            this.sessionManager.unblockIP(userIP);

            const sessionId = hashGenerator.generateRandomKey();
            this.sessionManager.createSession(sessionId);

            res.cookie('sessionId', sessionId, SESSION_COOKIE_OPTIONS);
            return noContent(res);
        }

        this.sessionManager.blockIP(userIP);
        return problem(res, {
            status: 401,
            title: 'Invalid credentials',
            detail: 'The provided username or password is incorrect.',
            code: 'INVALID_CREDENTIALS',
        });
    }

    /**
     * DELETE /api/auth/session
     * Destroys the current session and clears the cookie.
     * Success: 204 No Content
     */
    #logout(req: Request, res: Response): Response {
        const sessionId = this.getSessionId(req);

        this.sessionManager.destroySession(sessionId);
        res.clearCookie('sessionId');
        return noContent(res);
    }

    /**
     * GET /api/auth/session
     * Delegates entirely to `SessionManager.verifyAndRefreshSession()` — the
     * same logic used by `AuthMiddleware` — so both paths share a single
     * implementation.
     *
     * Response: { authenticated: true } on 200, 401 Problem Details otherwise.
     */
    #session(req: Request, res: Response): Response {
        const sessionId = this.getSessionId(req);

        if (this.sessionManager.verifyAndRefreshSession(sessionId)) {
            return ok(res, { authenticated: true });
        }

        return problem(res, {
            status: 401,
            title: 'Unauthorized',
            detail: 'The dashboard session is missing or expired.',
            code: 'SESSION_INVALID',
        });
    }

    /**
     * GET /api/auth/config
     * Returns the public login configuration consumed by the dashboard.
     *
     * Response: { loginMode: 'credentials' | 'oauth2', oauth2AuthorizationUrl: string | null }
     */
    #config(_req: Request, res: Response): Response {
        if (this.bot.config.webDashboard.loginType !== LoginTypeEnum.OAUTH2) {
            return ok(res, {
                loginMode: 'credentials',
                oauth2AuthorizationUrl: null,
            });
        }

        return ok(res, {
            loginMode: 'oauth2',
            oauth2AuthorizationUrl: null,
        });
    }

    /**
     * POST /api/auth/oauth2/authorization-url
     * Creates a one-time OAuth2 authorization URL with a short-lived state token.
     */
    #createOAuth2AuthorizationUrl(req: Request, res: Response): Response {
        if (this.bot.config.webDashboard.loginType !== LoginTypeEnum.OAUTH2) {
            return problem(res, {
                status: 409,
                title: 'OAuth2 login unavailable',
                detail: 'The dashboard is not configured to use OAuth2 login.',
                code: 'OAUTH2_DISABLED',
            });
        }

        const baseLink = this.bot.config.webDashboard.oauth2.link;
        if (!baseLink) {
            return problem(res, {
                status: 500,
                title: 'OAuth2 configuration error',
                detail: 'The dashboard OAuth2 authorization URL is not configured.',
                code: 'OAUTH2_LINK_MISSING',
            });
        }

        // Prune expired states before adding a new one
        this.#cleanExpiredOAuthStates();
        const requesterIp = req.ip ?? '';

        // Reject if too many pending states (anti-DoS)
        if (this.#oauthStates.size >= OAUTH2_STATE_MAX) {
            return problem(res, {
                status: 429,
                title: 'Too many pending OAuth2 requests',
                detail: 'Please wait before requesting another OAuth2 authorization URL.',
                code: 'OAUTH2_PENDING_LIMIT',
            });
        }

        if (this.#countPendingOAuthStatesForIP(requesterIp) >= OAUTH2_STATE_MAX_PER_IP) {
            return problem(res, {
                status: 429,
                title: 'Too many pending OAuth2 requests',
                detail: 'Too many OAuth2 login attempts are already in progress from this IP address.',
                code: 'OAUTH2_PENDING_LIMIT_PER_IP',
            });
        }

        const state = hashGenerator.generateRandomKey();
        this.#oauthStates.set(state, {
            expiresAt: Date.now() + OAUTH2_STATE_TTL_MS,
            requesterIp,
        });
        res.cookie(OAUTH2_STATE_COOKIE_NAME, state, {
            ...OAUTH2_STATE_COOKIE_OPTIONS,
            maxAge: OAUTH2_STATE_TTL_MS,
        });

        // Append state to the base Discord authorization URL
        const oauth2AuthorizationUrl = `${baseLink}&state=${encodeURIComponent(state)}`;
        return ok(res, { oauth2AuthorizationUrl });
    }

    /**
     * GET /api/auth/oauth2/callback?code=...&state=...
     * Validates the CSRF state, exchanges the authorization code for a token,
     * verifies the user is in the admin list, then creates a session.
     */
    async #oauth2Callback(req: Request, res: Response): Promise<void> {
        const userIP = req.ip ?? '';

        if (this.sessionManager.checkBlocked(userIP)) {
            this.bot.logger.api( `Blocked IP: ${userIP}, attempts OAuth2 login.`);
            this.#redirectToLogin(res, 'blocked');
            return;
        }

        // Already authenticated — redirect immediately
        if (this.sessionManager.verifyAndRefreshSession(this.getSessionId(req))) {
            res.redirect('/');
            return;
        }

        const { code, state } = req.query as { code?: string; state?: string };
        const stateCookie = this.#getOAuthStateCookie(req);

        // Validate CSRF state — reject if missing, expired, or unknown
        const stateRecord = state ? this.#oauthStates.get(state) : undefined;
        if (!state || !stateCookie || stateCookie !== state || stateRecord === undefined || stateRecord.expiresAt < Date.now()) {
            if (state) this.#oauthStates.delete(state);
            this.#clearOAuthStateCookie(res);
            this.#redirectToLogin(res, 'state_invalid');
            return;
        }

        // Consume the state token (one-time use)
        this.#oauthStates.delete(state);
        this.#clearOAuthStateCookie(res);

        if (!code) {
            this.#redirectToLogin(res, 'code_missing');
            return;
        }

        try {
            const clientIds = await this.shardManager.fetchClientValues('user.id');
            const clientId = (clientIds as string[])[0];
            if (!clientId) {
                this.#redirectToLogin(res, 'bot_not_ready');
                return;
            }

            const tokenResponse = await undici.request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: this.bot.config.bot.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.bot.config.webDashboard.oauth2.redirectUri,
                    scope: 'identify',
                }).toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            // Fail fast if Discord rejected the token exchange (e.g., expired/used code)
            if (tokenResponse.statusCode !== 200) {
                this.bot.logger.api( `OAuth2 token exchange failed: HTTP ${tokenResponse.statusCode}`);
                this.#redirectToLogin(res, 'exchange_failed');
                return;
            }

            const oauthData = await tokenResponse.body.json() as {
                token_type: string;
                access_token: string;
            };

            const userResult = await undici.request('https://discord.com/api/users/@me', {
                headers: { authorization: `${oauthData.token_type} ${oauthData.access_token}` },
            });

            if (userResult.statusCode === 200) {
                const user = await userResult.body.json() as { id: string };

                if (this.bot.config.bot.admin.includes(user.id)) {
                    this.sessionManager.unblockIP(userIP);

                    const sessionId = hashGenerator.generateRandomKey();
                    this.sessionManager.createSession(sessionId);

                    res.cookie('sessionId', sessionId, SESSION_COOKIE_OPTIONS);
                    res.redirect('/');
                }
                else {
                    // Do NOT block the IP for a non-admin Discord account:
                    // blocking here would cause collateral damage on shared NAT networks
                    // where multiple users (including legitimate admins) share one IP.
                    this.bot.logger.api( `OAuth2 login denied — non-admin user: ${user.id} from ${userIP}`);
                    this.#redirectToLogin(res, 'admin_required');
                }
            }
            else {
                this.sessionManager.blockIP(userIP);
                this.#redirectToLogin(res, 'user_fetch_failed');
            }
        }
        catch (error) {
            this.bot.logger.api( `OAuth2 callback error: ${error}`);
            this.#redirectToLogin(res, 'callback_failed');
        }
    }


    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Compares a plain-text input password against a stored credential.
     *
     * Two storage formats are supported:
     *  - **bcrypt hash** (starts with `$2a`, `$2b`, or `$2y`): use `bcrypt.compare`.
     *    Recommended for all new installations.
     *  - **Plain text** (legacy): fall back to `timingSafeEqual` comparison so
     *    existing configs continue to work without a forced migration.
     *
     * @param input  - The password supplied by the user
     * @param stored - The credential from `config.webDashboard.user.password`
     */
    static async #comparePassword(input: string, stored: string): Promise<boolean> {
        // Detect bcrypt hash: $2a$, $2b$, or $2y$ prefix
        if (/^\$2[aby]\$/.test(stored)) {
            return bcrypt.compare(input, stored);
        }

        // Legacy plain-text fallback — use constant-time comparison to resist
        // timing attacks even when the user has not migrated to bcrypt
        const inputBuf = Buffer.from(input);
        const storedBuf = Buffer.from(stored);

        return (
            inputBuf.length === storedBuf.length &&
            timingSafeEqual(inputBuf, storedBuf)
        );
    }

    /** Removes OAuth2 state tokens that have passed their expiry time. */
    #cleanExpiredOAuthStates(): void {
        const now = Date.now();
        for (const [state, record] of this.#oauthStates) {
            if (record.expiresAt <= now) {
                this.#oauthStates.delete(state);
            }
        }
    }

    #countPendingOAuthStatesForIP(requesterIp: string): number {
        let count = 0;

        for (const record of this.#oauthStates.values()) {
            if (record.requesterIp === requesterIp) {
                count += 1;
            }
        }

        return count;
    }

    #getOAuthStateCookie(req: Request): string {
        return parseCookie(req.headers.cookie ?? '')[OAUTH2_STATE_COOKIE_NAME] ?? '';
    }

    #clearOAuthStateCookie(res: Response): void {
        res.clearCookie(OAUTH2_STATE_COOKIE_NAME, OAUTH2_STATE_COOKIE_OPTIONS);
    }
    #redirectToLogin(res: Response, errorCode?: string): void {
        if (!errorCode) {
            res.redirect('/login');
            return;
        }

        res.redirect(`/login?oauth2Error=${encodeURIComponent(errorCode)}`);
    }
}
