import * as dotenv from 'dotenv';
import type { Client } from 'discord.js';


dotenv.config();

const setEnvironment = (client: Client) => {
    return new Promise<void>((resolve, _reject) => {
        // Admin of the bot
        client.config.admin = process.env.BOT_ADMIN || client.config.admin;

        // Bot settings
        client.config.name = process.env.BOT_NAME || client.config.name;
        client.config.prefix = process.env.BOT_PREFIX || client.config.prefix;
        client.config.status = ['online', 'idle', 'dnd'].includes(String(process.env.BOT_STATUS)) ? String(process.env.BOT_STATUS) : client.config.status;
        client.config.playing = process.env.BOT_PLAYING || client.config.playing;
        client.config.embedsColor = process.env.BOT_EMBEDS_COLOR || client.config.embedsColor;

        // Volume settings
        client.config.defaultVolume = (isNumber(process.env.DEFAULT_VOLUME) && Number(process.env.DEFAULT_VOLUME) !== 0) ? Number(process.env.DEFAULT_VOLUME) : client.config.defaultVolume;
        client.config.maxVolume = (isNumber(process.env.MAX_VOLUME) && Number(process.env.MAX_VOLUME) !== 0) ? Number(process.env.MAX_VOLUME) : client.config.maxVolume;

        // Auto leave channel settings
        client.config.autoLeave = isTrueOrFalse(process.env.AUTO_LEAVE) ?? client.config.autoLeave;
        client.config.autoLeaveCooldown = isNumber(process.env.AUTO_LEAVE_COOLDOWN) ? Number(process.env.AUTO_LEAVE_COOLDOWN) : client.config.autoLeaveCooldown;

        // Show voice channel updates
        client.config.displayVoiceState = isTrueOrFalse(process.env.DISPLAY_VOICE_STATE) ?? client.config.displayVoiceState;

        // Start API and Dashboard
        client.config.loadAPI = isTrueOrFalse(process.env.LOAD_API) ?? client.config.loadAPI;
        client.config.port = isNumber(process.env.PORT) ? Number(process.env.PORT) : client.config.port;

        // console.log('setEnvironment: ', client.config);
        resolve();
    });
};

export { setEnvironment };


const isNumber = (value: any): boolean => {
    return !isNaN(Number(value));
};

const isTrueOrFalse = (value: any) => {
    if (value === 'true') {
        return true;
    }
    else if (value === 'false') {
        return false;
    }
    else {
        return null;
    }
};