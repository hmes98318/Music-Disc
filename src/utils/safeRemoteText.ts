import {lookup} from 'node:dns/promises';
import {BlockList, isIP} from 'node:net';

import {Agent, fetch} from 'undici';

import type {LookupAddress} from 'node:dns';
import type {LookupFunction} from 'node:net';


export const DEFAULT_REMOTE_TEXT_MAX_BYTES = 1024 * 1024;
export const DEFAULT_REMOTE_TEXT_MAX_REDIRECTS = 3;
export const DEFAULT_REMOTE_TEXT_TIMEOUT_MS = 15_000;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const blockedIpv4Addresses = new BlockList();
const blockedIpv4Subnets = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4]
] as const;

for (const [network, prefix] of blockedIpv4Subnets) {
    blockedIpv4Addresses.addSubnet(network, prefix, 'ipv4');
}

const allowedIpv6Addresses = new BlockList();
allowedIpv6Addresses.addSubnet('2000::', 3, 'ipv6');

const blockedIpv6Addresses = new BlockList();
blockedIpv6Addresses.addSubnet('2001::', 32, 'ipv6');
blockedIpv6Addresses.addSubnet('2001:db8::', 32, 'ipv6');
blockedIpv6Addresses.addSubnet('2002::', 16, 'ipv6');

export type SafeRemoteTextErrorCode =
    | 'BLOCKED_ADDRESS'
    | 'DNS_LOOKUP_FAILED'
    | 'HTTP_STATUS'
    | 'INVALID_URL'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'TOO_LARGE'
    | 'TOO_MANY_REDIRECTS'
    | 'UNSAFE_PROTOCOL';

export class SafeRemoteTextError extends Error {
    readonly code: SafeRemoteTextErrorCode;
    readonly status?: number;

    constructor(code: SafeRemoteTextErrorCode, message: string, status?: number) {
        super(message);
        this.name = 'SafeRemoteTextError';
        this.code = code;
        this.status = status;
    }
}

export interface SafeRemoteTextOptions {
    maxBytes?: number;
    maxRedirects?: number;
    timeoutMs?: number;
}

interface ResolvedAddress extends LookupAddress {
    family: 4 | 6;
}

interface RemoteTextLimits {
    maxBytes: number;
    maxRedirects: number;
    timeoutMs: number;
}

/** Returns whether an IP address is globally routable for remote imports. */
export function isPublicNetworkAddress(address: string): boolean {
    const normalizedAddress = normalizeIpAddress(address);
    const family = isIP(normalizedAddress);

    if (family === 4) {
        return !blockedIpv4Addresses.check(normalizedAddress, 'ipv4');
    }

    if (family === 6) {
        return allowedIpv6Addresses.check(normalizedAddress, 'ipv6') &&
            !blockedIpv6Addresses.check(normalizedAddress, 'ipv6');
    }

    return false;
}

/** Parses a remote import URL and enforces the public HTTPS-only policy. */
export function validateRemoteTextUrl(rawUrl: string): URL {
    let url: URL;

    try {
        url = new URL(rawUrl);
    } catch (error) {
        throw new SafeRemoteTextError('INVALID_URL', 'The import URL is invalid.');
    }

    if (url.protocol !== 'https:') {
        throw new SafeRemoteTextError('UNSAFE_PROTOCOL', 'Only HTTPS import URLs are allowed.');
    }

    if (!url.hostname || url.username || url.password) {
        throw new SafeRemoteTextError('INVALID_URL', 'The import URL contains unsupported credentials or no hostname.');
    }

    return url;
}

/** Reads a response stream without allowing it to exceed the byte limit. */
export async function readTextBodyWithLimit(
    body: ReadableStream<Uint8Array> | null,
    maxBytes: number
): Promise<string> {
    if (!body) {
        return '';
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let byteCount = 0;
    let text = '';

    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }

            byteCount += value.byteLength;
            if (byteCount > maxBytes) {
                await reader.cancel();
                throw new SafeRemoteTextError('TOO_LARGE', 'The remote file exceeds the allowed size.');
            }

            text += decoder.decode(value, {stream: true});
        }

        return text + decoder.decode();
    } finally {
        reader.releaseLock();
    }
}

/** Downloads a small text file while preventing SSRF and unbounded reads. */
export async function fetchSafeRemoteText(
    rawUrl: string,
    options: SafeRemoteTextOptions = {}
): Promise<string> {
    const limits = getRemoteTextLimits(options);
    const signal = AbortSignal.timeout(limits.timeoutMs);
    let currentUrl = validateRemoteTextUrl(rawUrl);

    for (let redirectCount = 0; ; redirectCount++) {
        const addresses = await resolvePublicAddresses(currentUrl.hostname);
        const dispatcher = createPinnedDispatcher(addresses, limits);

        try {
            const response = await fetch(currentUrl, {
                dispatcher,
                headers: {
                    accept: 'application/vnd.apple.mpegurl, audio/mpegurl, text/plain, */*',
                    'user-agent': 'Music-Disc playlist importer'
                },
                redirect: 'manual',
                signal
            });

            if (REDIRECT_STATUSES.has(response.status)) {
                await response.body?.cancel();

                if (redirectCount >= limits.maxRedirects) {
                    throw new SafeRemoteTextError(
                        'TOO_MANY_REDIRECTS',
                        'The remote file exceeded the redirect limit.'
                    );
                }

                const location = response.headers.get('location');
                if (!location) {
                    throw new SafeRemoteTextError('INVALID_URL', 'The redirect response has no destination.');
                }

                currentUrl = validateRemoteTextUrl(new URL(location, currentUrl).toString());
                continue;
            }

            if (!response.ok) {
                await response.body?.cancel();
                throw new SafeRemoteTextError(
                    'HTTP_STATUS',
                    `The remote server returned HTTP ${response.status}.`,
                    response.status
                );
            }

            const contentLength = Number(response.headers.get('content-length'));
            if (Number.isFinite(contentLength) && contentLength > limits.maxBytes) {
                await response.body?.cancel();
                throw new SafeRemoteTextError('TOO_LARGE', 'The remote file exceeds the allowed size.');
            }

            return await readTextBodyWithLimit(response.body, limits.maxBytes);
        } catch (error) {
            if (error instanceof SafeRemoteTextError) {
                throw error;
            }

            if (signal.aborted || isAbortError(error)) {
                throw new SafeRemoteTextError('TIMEOUT', 'The remote file download timed out.');
            }

            if (isResponseSizeError(error)) {
                throw new SafeRemoteTextError('TOO_LARGE', 'The remote file exceeds the allowed size.');
            }

            throw new SafeRemoteTextError('NETWORK_ERROR', 'The remote file could not be downloaded.');
        } finally {
            await dispatcher.close().catch(() => {});
        }
    }
}

function normalizeIpAddress(address: string): string {
    const withoutBrackets = address.startsWith('[') && address.endsWith(']')
        ? address.slice(1, -1)
        : address;
    return withoutBrackets.split('%')[0];
}

function getRemoteTextLimits(options: SafeRemoteTextOptions): RemoteTextLimits {
    return {
        maxBytes: getPositiveInteger(options.maxBytes, DEFAULT_REMOTE_TEXT_MAX_BYTES),
        maxRedirects: getNonNegativeInteger(options.maxRedirects, DEFAULT_REMOTE_TEXT_MAX_REDIRECTS),
        timeoutMs: getPositiveInteger(options.timeoutMs, DEFAULT_REMOTE_TEXT_TIMEOUT_MS)
    };
}

function getPositiveInteger(value: number | undefined, fallback: number): number {
    return Number.isInteger(value) && value !== undefined && value > 0 ? value : fallback;
}

function getNonNegativeInteger(value: number | undefined, fallback: number): number {
    return Number.isInteger(value) && value !== undefined && value >= 0 ? value : fallback;
}

async function resolvePublicAddresses(hostname: string): Promise<ResolvedAddress[]> {
    const normalizedHostname = normalizeIpAddress(hostname);

    try {
        const records = isIP(normalizedHostname)
            ? [{address: normalizedHostname, family: isIP(normalizedHostname)}]
            : await lookup(normalizedHostname, {all: true, order: 'verbatim'});

        if (records.length === 0) {
            throw new SafeRemoteTextError('DNS_LOOKUP_FAILED', 'The import hostname did not resolve.');
        }

        const addresses = records.map((record) => ({
            address: normalizeIpAddress(record.address),
            family: record.family as 4 | 6
        }));

        if (addresses.some((record) => !isPublicNetworkAddress(record.address))) {
            throw new SafeRemoteTextError('BLOCKED_ADDRESS', 'The import hostname resolves to a blocked address.');
        }

        return addresses;
    } catch (error) {
        if (error instanceof SafeRemoteTextError) {
            throw error;
        }

        throw new SafeRemoteTextError('DNS_LOOKUP_FAILED', 'The import hostname could not be resolved.');
    }
}

function createPinnedDispatcher(addresses: readonly ResolvedAddress[], limits: RemoteTextLimits): Agent {
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
        const requestedFamily = options.family ?? 0;
        const candidates = requestedFamily === 0
            ? addresses
            : addresses.filter((address) => address.family === requestedFamily);

        if (candidates.length === 0) {
            const error = new Error('No validated address matches the requested IP family.') as NodeJS.ErrnoException;
            error.code = 'ENOTFOUND';
            callback(error, '', 0);
            return;
        }

        if (options.all) {
            callback(null, [...candidates]);
            return;
        }

        const selectedAddress = candidates[0];
        callback(null, selectedAddress.address, selectedAddress.family);
    };

    return new Agent({
        bodyTimeout: limits.timeoutMs,
        connect: {lookup: pinnedLookup},
        connectTimeout: limits.timeoutMs,
        headersTimeout: limits.timeoutMs,
        maxResponseSize: limits.maxBytes + 1
    });
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

function isResponseSizeError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const errorWithCause = error as Error & {cause?: {code?: string}; code?: string};
    return errorWithCause.code === 'UND_ERR_RES_EXCEEDED' ||
        errorWithCause.cause?.code === 'UND_ERR_RES_EXCEEDED';
}
