import { HexColorString } from "discord.js";


export interface Config {
    name: string;
    prefix: string;
    playing: string;
    embedsColor: HexColorString | string | number;
    defaultVolume: number;
    maxVolume: number;
    autoLeave: boolean;
    autoLeaveCooldown: number;
    displayVoiceState: boolean;
    port: number;
    blacklist: string[];
}

export interface Info {
    uptime: Date;
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
}