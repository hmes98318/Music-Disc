import type { IPBlockerConfig } from "../../@types/SessionManager.types";


export interface IPInfo {
    retry: number;                      // Retry count
    block: boolean;                     // Whether blocked
    createdAt: number;                  // Create time (ms)
    unlockTimeout?: NodeJS.Timeout;     // Auto-unlock block timer
}


export class IPBlocker {
    #ipPool: Map<string, IPInfo>;
    #retryLimit: number;
    #unlockTimeoutDuration: number;
    #cleanupInterval: number;

    /**
     * @param {number} config.retryLimit - 重試次數 (default: 5)
     * @param {number} config.unlockTimeoutDuration - 封鎖時間(ms) (default: 5 minutes)
     * @param {number} config.cleanupInterval - 定時清理器時間(ms) (default: 5 minutes)
     */
    constructor(config?: IPBlockerConfig) {
        this.#ipPool = new Map<string, IPInfo>();

        if (config) {
            this.#retryLimit = config.retryLimit;
            this.#unlockTimeoutDuration = config.unlockTimeoutDuration;
            this.#cleanupInterval = config.cleanupInterval;
        }
        else {
            this.#retryLimit = 5;
            this.#unlockTimeoutDuration = 5 * 60 * 1000;
            this.#cleanupInterval = 5 * 60 * 1000;
        }


        this.#autoCleanup(this.#cleanupInterval);
    }


    /**
     * 添加 IP 進入封鎖池
     * @param {string} ip - ip
     */
    public add(ip: string): void {
        const existingInfo = this.#ipPool.get(ip);

        // IP exists in the pool
        if (existingInfo) {
            if (existingInfo.block) return;


            if (existingInfo.retry >= this.#retryLimit - 1) {
                existingInfo.block = true;

                // Set unlock timeout for 5 minutes
                existingInfo.unlockTimeout = setTimeout(() => {
                    this.delete(ip);
                }, this.#unlockTimeoutDuration);
            }
            else {
                existingInfo.retry++;
                existingInfo.createdAt = Date.now();
            }
        }
        // IP doesn't exist in the pool
        else {
            const newInfo: IPInfo = {
                retry: 1,
                block: false,
                createdAt: Date.now(),
            };

            this.#ipPool.set(ip, newInfo);
        }
    }

    /**
     * 檢查 IP 是否被封鎖
     * @param {string} ip - ip
     * @returns {boolean} - true: 被封鎖, false: 沒被鎖
     */
    public checkBlocked(ip: string): boolean {
        const info = this.#ipPool.get(ip);

        return info ? info.block : false;
    }

    /**
     * 從封鎖池刪除 IP
     * @param {string} ip - ip
     * @returns {boolean}
     */
    public delete(ip: string): boolean {
        const info = this.#ipPool.get(ip);
        if (info) {
            // Clear the unlock timeout
            if (info.unlockTimeout) {
                clearTimeout(info.unlockTimeout);
            }
        }

        return this.#ipPool.delete(ip);
    }

    /**
     * 獲取封鎖池中所有 IP
     */
    public getAll(): [string, IPInfo][] {
        return Array.from(this.#ipPool.entries());
    }


    /**
     * 自動清理封鎖池過期 IP
     * @private
     * @param {number} cleanupInterval - Checking interval (ms)
     */
    #autoCleanup(cleanupInterval: number) {
        setInterval(() => {
            const now = Date.now();
            for (const [ip, info] of this.#ipPool) {
                // Delete IP if it's not blocked and the cleanup interval has passed since its creation
                if (!info.block && now - info.createdAt >= this.#cleanupInterval) {
                    this.delete(ip);
                }
            }
        }, cleanupInterval);
    }
}
