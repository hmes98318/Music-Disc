export interface ApiProblem {
    type?: string;
    title: string;
    status: number;
    detail?: string;
    code?: string;
    errors?: unknown;
}

export class ApiError extends Error {
    readonly status: number;
    readonly problem?: ApiProblem;

    constructor(status: number, message: string, problem?: ApiProblem) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.problem = problem;
    }

    get code(): string | undefined {
        return this.problem?.code;
    }

    get detail(): string | undefined {
        return this.problem?.detail;
    }

    get isUnauthorized(): boolean {
        return this.status === 401;
    }
}

interface RequestOptions {
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
}

export const useApi = () => {
    const basePath = '/api';

    function buildUrl(path: string, query?: RequestOptions['query']): string {
        const searchParams = new URLSearchParams();

        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value === undefined || value === null || value === '') {
                    continue;
                }

                searchParams.set(key, String(value));
            }
        }

        const search = searchParams.toString();
        return `${basePath}${path}${search ? `?${search}` : ''}`;
    }

    async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
        const res = await fetch(buildUrl(path, options.query), {
            method,
            credentials: 'include',
            headers: options.body ? { 'Content-Type': 'application/json' } : {},
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
            let problem: ApiProblem | undefined;

            try {
                problem = (await res.json()) as ApiProblem;
            } catch {
                problem = undefined;
            }

            throw new ApiError(
                res.status,
                problem?.title ?? `API ${method} ${path} failed with ${res.status}`,
                problem,
            );
        }

        if (res.status === 204) {
            return undefined as T;
        }

        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            return undefined as T;
        }

        return res.json() as Promise<T>;
    }

    const createSession = (username: string, password: string) =>
        request<void>('POST', '/auth/session', { body: { username, password } });

    const deleteSession = () => request<void>('DELETE', '/auth/session');

    const getSession = () => request<SessionState>('GET', '/auth/session');

    const getAuthConfig = () => request<AuthConfig>('GET', '/auth/config');

    const createOAuth2AuthorizationUrl = () =>
        request<OAuth2AuthorizationUrlResponse>('POST', '/auth/oauth2/authorization-url');

    const getBotSummary = () => request<BotSummary>('GET', '/bot');

    const getBotRuntime = () => request<BotRuntime>('GET', '/bot/runtime');

    const getBotIntents = () => request<BotIntents>('GET', '/bot/intents');

    const getNodes = () => request<NodeListResponse>('GET', '/nodes');

    const getServers = (query: ServerListQuery = {}) =>
        request<ServerListResponse>('GET', '/servers', {
            query: query as Record<string, string | number | boolean | null | undefined>,
        });

    const getServer = (guildId: string) => request<ServerDetail>('GET', `/servers/${guildId}`);

    const deleteServer = (guildId: string) => request<void>('DELETE', `/servers/${guildId}`);

    const getBotLogs = (query: LogQuery = {}) =>
        request<LogsPage>('GET', '/logs/bot', {
            query: query as Record<string, string | number | boolean | null | undefined>,
        });

    const getLocalNodeSummary = () => request<LocalNodeSummary>('GET', '/localnode');

    const ensureLocalNodeProcess = (forceRestart = false) =>
        request<LocalNodeProcessState>('PUT', '/localnode/process', { body: { forceRestart } });

    const stopLocalNodeProcess = () => request<void>('DELETE', '/localnode/process');

    const getLocalNodeLogs = (query: LogQuery = {}) =>
        request<LogsPage>('GET', '/localnode/logs', {
            query: query as Record<string, string | number | boolean | null | undefined>,
        });

    const createMaintenanceNotice = () => request<MaintenanceNoticeResult>('POST', '/maintenance/notices');

    const getThumbnailUrl = (source: string, id: string) =>
        request<ThumbnailResponse>('GET', `/media/thumbnails/${source}/${id}`);

    return {
        createSession,
        createOAuth2AuthorizationUrl,
        createMaintenanceNotice,
        deleteServer,
        deleteSession,
        ensureLocalNodeProcess,
        getAuthConfig,
        getBotIntents,
        getBotLogs,
        getBotRuntime,
        getBotSummary,
        getLocalNodeLogs,
        getLocalNodeSummary,
        getNodes,
        getServer,
        getServers,
        getSession,
        getThumbnailUrl,
        stopLocalNodeProcess,
    };
};

export interface SessionState {
    authenticated: boolean;
}

export interface AuthConfig {
    loginMode: 'credentials' | 'oauth2';
    oauth2AuthorizationUrl: string | null;
}

export interface OAuth2AuthorizationUrlResponse {
    oauth2AuthorizationUrl: string;
}

export interface BotSummary {
    name: string;
    startupTime: string;
    versions: {
        bot: string;
        node: string;
        discordJs: string;
        lavashark: string;
    };
    environment: {
        os: string;
        cpu: string;
    };
    guilds: {
        total: number;
        perShard: number[];
    };
    i18n: {
        defaultLocale: string;
    };
}

export interface BotRuntime {
    load: { percent: number; detail: string };
    memory: { percent: number; detail: string };
    heap: { percent: number; detail: string };
    uptime: string;
    ping: { gateway: number[] };
    players: { total: number; perShard: number[] };
}

export interface IntentStatus {
    name: string;
    required: boolean;
    enabled: boolean;
}

export interface BotIntents {
    standard: IntentStatus[];
    privileged: IntentStatus[];
    hasExtraPrivileged: boolean;
}

export interface NodeStatus {
    id: string;
    state: number;
    info: Record<string, unknown>;
    stats: Record<string, unknown>;
    ping: number;
}

export interface NodeListResponse {
    items: NodeStatus[];
}

export interface ServerListQuery {
    page?: number;
    pageSize?: number;
    playing?: boolean;
    guildId?: string;
}

export interface ServerListItem {
    id: string;
    name: string;
    iconUrl: string | null;
    memberCount: number;
    isPlaying: boolean;
    shardId: number;
}

export interface ServerListResponse {
    items: ServerListItem[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}

export interface ServerDetail {
    guild: {
        id: string;
        name: string;
        iconUrl: string | null;
        memberCount: number;
        ownerId: string;
        preferredLocale: string;
        createdAt: string;
        shardId: number;
        features: string[];
        counts: {
            roles: number;
            channels: number;
            textChannels: number;
            voiceChannels: number;
        };
        channels: {
            system: ChannelReference | null;
            rules: ChannelReference | null;
            publicUpdates: ChannelReference | null;
            afk: ChannelReference | null;
        };
    };
    botMember: {
        joinedAt: string | null;
        nickname: string | null;
    };
    playback: {
        active: boolean;
        status: 'idle' | 'paused' | 'playing';
        endpoint: string | null;
        volume: {
            current: number | null;
            max: number;
        };
        repeatMode: 'off' | 'track' | 'queue';
        currentTrack: ServerTrack | null;
    };
    voiceChannel: {
        id: string;
        name: string;
        memberCount: number;
        members: VoiceMember[];
    } | null;
    capabilities: {
        voiceMemberSnapshot: boolean;
        messageContent: boolean;
    };
}

export interface ChannelReference {
    id: string;
    name: string;
}

export interface ServerTrack {
    title: string;
    author: string;
    url: string;
    durationMs: number;
    sourceName: string;
    identifier: string;
}

export interface VoiceMember {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isBot: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    isStreaming: boolean;
    hasVideo: boolean;
}

export interface LogQuery {
    limit?: number;
    before?: number;
    after?: number;
}

export interface LogEntry {
    cursor: number;
    lineNumber: number;
    message: string;
}

export interface LogsPage {
    items: LogEntry[];
    sourceId: string;
    pagination: {
        limit: number;
        oldestCursor: number | null;
        newestCursor: number | null;
        hasOlder: boolean;
        hasNewer: boolean;
        totalItems: number;
    };
}

export interface LocalNodeSummary {
    enabled: boolean;
    process: LocalNodeProcessState;
}

export interface LocalNodeProcessState {
    active: boolean;
    starting?: boolean;
    pid: number | null;
    port: number | null;
    autoRestart?: boolean;
}

export interface MaintenanceNoticeResult {
    sentGuildCount: number;
}

export interface ThumbnailResponse {
    url: string;
}
