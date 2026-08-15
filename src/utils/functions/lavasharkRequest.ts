import type { LavaShark } from 'lavashark';


const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 2000;

/**
 * Wait for the given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Search a track with retries.
 * Lavalink nodes enforce REST rate limits (HTTP 429); a single retry after a
 * short delay lets transient rate limiting resolve without skipping tracks.
 */
export async function searchWithRetry(
    lavashark: LavaShark,
    query: string,
    attempts: number = DEFAULT_RETRY_ATTEMPTS,
    retryDelayMs: number = DEFAULT_RETRY_DELAY_MS,
): Promise<any | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await lavashark.search(query);
        } catch {
            if (attempt < attempts - 1) {
                await sleep(retryDelayMs);
            }
        }
    }
    return null;
}

/**
 * Decode a track from its encoded string with retries
 */
export async function decodeTrackWithRetry(
    lavashark: LavaShark,
    encoded: string,
    attempts: number = DEFAULT_RETRY_ATTEMPTS,
    retryDelayMs: number = DEFAULT_RETRY_DELAY_MS,
): Promise<any | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await lavashark.decodeTrack(encoded);
        } catch {
            if (attempt < attempts - 1) {
                await sleep(retryDelayMs);
            }
        }
    }
    return null;
}

/**
 * Decode many tracks in a single request.
 * Lavalink rate limits REST calls (HTTP 429) aggressively; bulk-decoding a
 * whole saved queue with one `/decodetracks` request avoids exhausting the
 * node's request budget entirely.
 */
export async function decodeTracksWithRetry(
    lavashark: LavaShark,
    encodedTracks: string[],
    attempts: number = DEFAULT_RETRY_ATTEMPTS,
    retryDelayMs: number = DEFAULT_RETRY_DELAY_MS,
): Promise<any[] | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await lavashark.decodeTracks(encodedTracks);
        } catch {
            if (attempt < attempts - 1) {
                await sleep(retryDelayMs);
            }
        }
    }
    return null;
}
