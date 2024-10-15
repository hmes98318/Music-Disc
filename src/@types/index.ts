import type {
    ChatInputCommandInteraction,
    ClientPresenceStatus,
    Collection,
    HexColorString,
    Message
} from "discord.js";
import type { LavaShark } from "lavashark";

import type { Logger } from "../lib/Logger";
import type { IPBlockerConfig, SessionManagerConfig } from "./SessionManager.types";


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


export enum LoginType {
    USER = 'USER',
    OAUTH2 = 'OAUTH2'
}


export interface Bot {
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
export interface Config {
    admin: string | null;
    clientSecret: string | null;
    name: string;
    prefix: string;
    status: ClientPresenceStatus | string;
    playing: string;
    embedsColor: HexColorString | string | number;
    slashCommand: boolean;
    defaultVolume: number;
    maxVolume: number;
    autoLeave: boolean;
    autoLeaveCooldown: number;
    displayVoiceState: boolean;
    enableSite: boolean;
    site: SiteConfig;
    enableLocalNode: boolean;
    localNode: LocalNode;
    sessionManager: SessionManagerConfig;
    ipBlocker: IPBlockerConfig;
}

interface SiteConfig {
    port: number;
    loginType: 'USER' | 'OAUTH2';
    username: string;
    password: string;
    oauth2Link: string | null;
    oauth2RedirectUri: string | null;
}

interface LocalNode {
    autoRestart: boolean;
    downloadLink: string;
}

export interface SystemInfo {
    startupTime: Date;
    os_version: string;
    bot_version: string;
    node_version: string;
    dc_version: string;
    shark_version: string;
    cpu: string;
}

export interface SystemStatus {
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