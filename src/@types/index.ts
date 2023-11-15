import type { ClientPresenceStatus, HexColorString, Message } from "discord.js";
import type { Logger } from "../core/lib/Logger";


export interface Bot {
    blacklist: string[];
    config: Config;
    logger: Logger;
    sysInfo: SystemInfo;
}

export interface Config {
    admin: string | null;
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
    username: string;
    password: string;
}

interface LocalNode {
    autoRestart: boolean;
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