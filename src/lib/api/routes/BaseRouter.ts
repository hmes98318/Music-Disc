import { parseCookie } from 'cookie';
import { Router } from 'express';

import type { Request } from 'express';
import type { ShardingManager } from 'discord.js';
import type { Bot } from '../../../@types/index.js';
import type { LocalNodeController } from '../../localnode/LocalNodeController.js';
import type { SessionManager } from '../../session-manager/SessionManager.js';


/**
 * Shared dependencies injected into every router.
 */
export interface RouterDependencies {
    bot: Bot;
    shardManager: ShardingManager;
    localNodeController: LocalNodeController;
    sessionManager: SessionManager;
}


/**
 * Abstract base class for all API routers.
 * Subclasses must implement `registerRoutes` to attach their route handlers.
 */
export abstract class BaseRouter {
    protected readonly router: Router;
    protected readonly bot: Bot;
    protected readonly shardManager: ShardingManager;
    protected readonly localNodeController: LocalNodeController;
    protected readonly sessionManager: SessionManager;

    constructor(deps: RouterDependencies) {
        this.router = Router();
        this.bot = deps.bot;
        this.shardManager = deps.shardManager;
        this.localNodeController = deps.localNodeController;
        this.sessionManager = deps.sessionManager;

        /**
         * NOTE: registerRoutes() is intentionally NOT called here.
         * Subclasses must call this.registerRoutes() at the end of their own
         * constructor — after class field initializers have run — to avoid
         * "Receiver must be an instance of class X" errors caused by accessing
         * private (#) fields before they are initialized.
         */
    }

    /**
     * Attach all route handlers to `this.router`.
     * Called automatically in the constructor.
     */
    protected abstract registerRoutes(): void;

    /**
     * Parses the `sessionId` cookie from the incoming request.
     * Centralises cookie parsing so subclasses do not repeat the same logic.
     */
    protected getSessionId(req: Request): string {
        return parseCookie(req.headers.cookie ?? '')['sessionId'] ?? '';
    }

    /**
     * Returns the configured Express Router instance.
     */
    public getRouter(): Router {
        return this.router;
    }
}
