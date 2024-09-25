import { IPBlocker } from "./IPBlocker";
import type { IPBlockerConfig, SessionManagerConfig } from "../../@types/SessionManager.types";


export interface SessionData {
    createdAt: number;      // milliseconds
}


export class SessionManager {
    public ipBlocker: IPBlocker;

    #sessionMap: Map<string, SessionData>; // <sessionId, sessionData>
    #validTime: number;
    #cleanupInterval: number;


    /**
     * @param {SessionManagerConfig} config - Session manager config
     * @param {IPBlockerConfig} ipBlockerConfig - IP blocker config
     */
    constructor(config?: SessionManagerConfig, ipBlockerConfig?: IPBlockerConfig | undefined) {
        if (config) {
            this.#validTime = config.validTime;
            this.#cleanupInterval = config.cleanupInterval;
        }
        else {
            this.#validTime = 10 * 60 * 1000;
            this.#cleanupInterval = 5 * 60 * 1000;
        }


        this.#sessionMap = new Map<string, SessionData>();
        this.ipBlocker = new IPBlocker(ipBlockerConfig);

        this.#autoCheckExpires(this.#cleanupInterval);
    }


    /**
     * Create a new session or refresh a session
     * @param sessionId - Session id
     */
    public createSession(sessionId: string): void {
        const now = new Date();
        const sessionData = {
            createdAt: now.setHours(now.getHours() + 1)
        };

        this.#sessionMap.set(sessionId, sessionData);
    }

    /**
     * Check if the session exists
     * @param {string} sessionId - Session id
     * @returns {boolean}
     */
    public checkSession(sessionId: string): boolean {
        const session = this.#sessionMap.get(sessionId);

        return session ? true : false;
    }

    /**
     * Destroy session
     * @param {string} sessionId - Session id
     * @returns {boolean}
     */
    public destroySession(sessionId: string): boolean {
        return this.#sessionMap.delete(sessionId);
    }

    /**
     * Get the session if the session exists
     * @param {string} sessionId - Session id
     * @returns {SessionData | false}
     */
    public getSession(sessionId: string): SessionData | false {
        const session = this.#sessionMap.get(sessionId);

        if (!session) {
            return false;
        }

        return session;
    }

    /**
     * Refresh an existing session
     * @param {string} sessionId - Session id
     */
    public refreshSession(sessionId: string): boolean {
        const session = this.#sessionMap.get(sessionId);

        if (!session) {
            return false;
        }

        session.createdAt = Date.now();
        return true;
    }

    /**
     * Get all session data
     */
    public getAll(): [string, SessionData][] {
        return Array.from(this.#sessionMap.entries());
    }


    /**
     * Automatically delete expired sessions
     * @private
     */
    #autoCheckExpires(cleanupInterval: number) {
        setInterval(() => {
            const now = Date.now();
            for (const [sessionId, sessionData] of this.#sessionMap) {
                if (now - sessionData.createdAt >= this.#validTime) {
                    this.destroySession(sessionId);
                }
            }
        }, cleanupInterval);
    }
}
