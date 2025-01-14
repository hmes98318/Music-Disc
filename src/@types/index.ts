import type {
    ActivityType,
    ChatInputCommandInteraction,
    ClientPresenceStatus,
    Collection,
    Message
} from 'discord.js';
import type { LavaShark } from 'lavashark';
import type { NodeOptions } from 'lavashark/typings/src/@types/index.js';

import type { Logger } from '../lib/Logger.js';
import type { IPBlockerConfig, SessionManagerConfig } from './SessionManager.types.js';


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark
    }
}

declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null;
        metadata: Message<boolean> | ChatInputCommandInteraction | null;
        setting: PlayerSetting;
    }
}

export interface PlayerSetting {
    queuePage: QueuePage | null;
    volume: number | null;
}

export interface QueuePage {
    maxPage: number;
    curPage: number;
    msg: Message<boolean> | null;
}


export enum LoginTypeEnum {
    USER = 'USER',
    OAUTH2 = 'OAUTH2',
}

export type LoginType = keyof typeof LoginTypeEnum;


export type Bot = {
    shardId: number;
    blacklist: string[];
    config: Config;
    logger: Logger;
    sysInfo: SystemInfo;
    stats: {
        guildsCount: number[];
        membersCount: number[];
        lastRefresh: number | null;     // Date.now()
    }
}

/**
 * Constants variables
 */
export type Config = {
    bot: BotConfig;
    nodeList: NodeOptions[];
    webDashboard: WebDashboardConfig;
    localNode: LocalNodeConfig;
};

export type BotConfig = {
    textCommand: boolean;
    slashCommand: boolean;
    admin: string[];
    clientSecret: string;
    name: string;
    prefix: string;
    status: ClientPresenceStatus;
    activity: {
        type: ActivityType;
        name: string;
        state?: string;
        url?: string;
    }
    embedsColor: string;
    volume: {
        default: number;
        max: number;
    };
    autoLeave: {
        enabled: boolean;
        cooldown: number;
    };
    displayVoiceState: boolean;
    specifyMessageChannel: string | null;
};

export type WebDashboardConfig = {
    enabled: boolean;
    port: number;
    loginType: LoginType;
    user: {
        username: string;
        password: string;
    };
    oauth2: {
        link: string;
        redirectUri: string;
    };
    sessionManager: SessionManagerConfig;
    ipBlocker: IPBlockerConfig;
};

export type LocalNodeConfig = {
    enabled: boolean;
    autoRestart: boolean;
    downloadLink?: string;
};


export type SystemInfo = {
    startupTime: Date;
    os_version: string;
    bot_version: string;
    node_version: string;
    dc_version: string;
    shark_version: string;
    cpu: string;
}

export type SystemStatus = {
    load: {
        percent: string;
        detail: string;
    };
    memory: {
        percent: string;
        detail: string;
    };
    heap: {
        percent: string;
        detail: string;
    };
    uptime: string;
    ping: {
        bot: string;
        api: number;
    };
    serverCount: number;
    totalMembers: number;
    playing: number;
}


export enum LoadType {
    TRACK = 'track',
    PLAYLIST = 'playlist',
    SEARCH = 'search',
    EMPTY = 'empty',
    ERROR = 'error'
}