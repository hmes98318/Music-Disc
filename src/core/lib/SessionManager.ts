export interface SessionData {
    createdAt: number; // milliseconds
}


export class SessionManager {
    #sessionMap: Map<string, SessionData>; // <sessionId, sessionData>

    constructor() {
        this.#sessionMap = new Map<string, SessionData>();
        this.#autoCheckExpires();
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
     * destroySession
     * @param sessionId - Session id
     */
    public destroySession(sessionId: string) {
        return this.#sessionMap.delete(sessionId);
    }

    /**
     * Check if the session exists
     * @param sessionId - Session id
     * @returns {boolean}
     */
    public getSession(sessionId: string): boolean {
        const session = this.#sessionMap.get(sessionId);

        if (session) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * refreshSession
     * @param sessionId - Session id
     */
    public refreshSession(sessionId: string): void {
        this.createSession(sessionId);
    }

    /**
     * Automatically delete expired sessions
     * @private
     */
    #autoCheckExpires() {
        setInterval(() => {
            this.#sessionMap.forEach((sessionData, sessionId, sessionMap) => {
                const now = new Date;
                if (sessionData.createdAt < now.setHours(now.getHours() - 1)) {
                    sessionMap.delete(sessionId);
                }
            });
        }, 5 * 60 * 1000); // 5 minutes
    }
}
