import { parseCookie } from 'cookie';

import { problem } from '../http.js';

import type { Request, Response, NextFunction } from 'express';
import type { SessionManager } from '../../session-manager/SessionManager.js';


/**
 * Express middleware that guards API routes behind session authentication.
 *
 * Cookie parsing and session verification are delegated to
 * `SessionManager.verifyAndRefreshSession()` — the same logic used by
 * `AuthRouter#verify` — so there is a single source of truth for what
 * constitutes a "valid session".
 *
 * Returns 401 JSON on unauthenticated requests.
 */
export class AuthMiddleware {
    readonly #sessionManager: SessionManager;

    constructor(sessionManager: SessionManager) {
        this.#sessionManager = sessionManager;
    }

    /**
     * Returns the Express middleware handler function.
     * Calls `next()` when the session is valid; responds 401 otherwise.
     */
    public handle() {
        return (req: Request, res: Response, next: NextFunction): void => {
            const sessionId = parseCookie(req.headers.cookie ?? '')['sessionId'] ?? '';

            if (this.#sessionManager.verifyAndRefreshSession(sessionId)) {
                next();
                return;
            }

            problem(res, {
                status: 401,
                title: 'Unauthorized',
                detail: 'A valid dashboard session is required.',
                code: 'AUTH_REQUIRED',
            });
        };
    }
}
