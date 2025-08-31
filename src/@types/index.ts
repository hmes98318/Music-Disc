import type {
    ActivityType,
    ChatInputCommandInteraction,
    ClientPresenceStatus,
    Collection,
    Message
} from 'discord.js';
import type { i18n } from 'i18next';
import type { LavaShark } from 'lavashark';
import type { NodeOptions } from 'lavashark/typings/src/@types/index.js';

import type { Language } from '../lib/i18n/Language.js';
import type { Logger } from '../lib/Logger.js';
import type { IPBlockerConfig, SessionManagerConfig } from './SessionManager.types.js';


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark,
        i18n: i18n;
    }
}

declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null;
        metadata: Message<boolean> | ChatInputCommandInteraction | null;
        setting: PlayerSetting;
        djUsers?: Set<string>;              // Dynamic DJ users for this guild
        djLeaveTimeout?: NodeJS.Timeout;    // Timeout for DJ leave cooldown
    }
}

export enum CommandCategory {
    MUSIC = 'Music',
    UTILITY = 'Utility',
}

export enum DJModeEnum {
    STATIC = 'STATIC',
    DYNAMIC = 'DYNAMIC',
}

export type DJMode = keyof typeof DJModeEnum;

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
    config: Config;
    logger: Logger;
    sysInfo: SystemInfo;
    stats: {
        guildsCount: number[];
        lastRefresh: number | null;     // Date.now()
    },
    i18n: i18n;
    lang: Language;
}

/**
 * Constants variables
 */
export type Config = {
    bot: BotConfig;
    nodeList: NodeOptions[];
    spotify: SpotifyConfig;
    blacklist: string[],
    webDashboard: WebDashboardConfig;
    localNode: LocalNodeConfig;
    command: CommandConfig;
};

export type BotConfig = {
    textCommand: boolean;
    slashCommand: boolean;
    admin: string[];
    djMode: DJMode;
    dj: string[];
    djRoleId: string | null;
    djLeaveCooldown: number;
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
    embedsColors: {
        message: string;
        success: string;
        error: string;
        warning: string;
    };
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
    specifyVoiceChannel: string | null;
    startupAutoJoin: boolean;
    i18n: {
        localePath: string;
        defaultLocale: string;
    }
};

export type SpotifyConfig = {
    clientId: string | null;
    clientSecret: string | null;
}

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

export type CommandConfig = {
    disableCommand: string[];
    adminCommand: string[];
    djCommand: string[];
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
    playing: number;
}


export enum LoadType {
    TRACK = 'track',
    PLAYLIST = 'playlist',
    SEARCH = 'search',
    EMPTY = 'empty',
    ERROR = 'error'
}