/**
 * SessionManager config
 * @param {number} validTime - Session 的有效時間(ms)
 * @param {number} cleanupInterval - 定時清理器時間(ms)
 */
export type SessionManagerConfig = {
    validTime: number;
    cleanupInterval: number;
}

/**
 * IPBlocker config
 * @param {number} retryLimit - 重試次數
 * @param {number} unlockTimeoutDuration - 封鎖時間(ms)
 * @param {number} cleanupInterval - 定時清理器時間(ms)
 */
export type IPBlockerConfig = {
    retryLimit: number;
    unlockTimeoutDuration: number;
    cleanupInterval: number;
}