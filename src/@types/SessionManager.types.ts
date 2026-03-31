/**
 * SessionManager config
 * @param {number} validTime - Session validity time (ms)
 * @param {number} cleanupInterval - Timing cleaner time (ms)
 */
export type SessionManagerConfig = {
    validTime: number;
    cleanupInterval: number;
}

/**
 * IPBlocker config
 * @param {number} retryLimit - Maximum number of retries
 * @param {number} unlockTimeoutDuration - Blocking time (ms)
 * @param {number} cleanupInterval - Timing cleaner time (ms)
 */
export type IPBlockerConfig = {
    retryLimit: number;
    unlockTimeoutDuration: number;
    cleanupInterval: number;
}