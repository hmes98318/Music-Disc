import type {
    ChatInputCommandInteraction,
    ClientPresenceStatus,
    Collection,
    HexColorString,
    Message
} from "discord.js";
import type { LavaShark } from "lavashark";
import type { Logger } from "../core/lib/Logger";


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark
    }
}

declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null,
        metadata: Message<boolean> | ChatInputCommandInteraction | null,
        queuePage: QueuePage
    }
}


export interface Bot {
    blacklist: string[];
    config: Config;
    logger: Logger;
    sysInfo: SystemInfo;
}

export interface Config {
    admin: string | null;
    clientSecret: string | null;
    name: string;
    prefix: string;
    status: ClientPresenceStatus | string;
    playing: string;
    embedsColor: HexColorString | string | number;
    defaultVolume: number;
    maxVolume: number;
    autoLeave: boolean;
    autoLeaveCooldown: number;
    displayVoiceState: boolean;
    enableSite: boolean;
    site: SiteConfig;
    enableLocalNode: boolean;
    localNode: LocalNode;
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
    playing: number;
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