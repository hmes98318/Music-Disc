import * as dotenv from 'dotenv';
import { hashGenerator } from '../lib/hashGenerator';
import type { Config, LoginType } from './../@types';


dotenv.config();

const setEnvironment = (config: Config) => {
    // Admin of the bot
    config.admin = process.env.BOT_ADMIN || config.admin;
    config.clientSecret = process.env.BOT_CLIENT_SECRET || config.clientSecret;

    // Bot settings
    config.name = process.env.BOT_NAME || config.name;
    config.prefix = process.env.BOT_PREFIX || config.prefix;
    config.status = ['online', 'idle', 'dnd'].includes(String(process.env.BOT_STATUS)) ? String(process.env.BOT_STATUS) : config.status;
    config.playing = process.env.BOT_PLAYING || config.playing;
    config.embedsColor = process.env.BOT_EMBEDS_COLOR || config.embedsColor;
    config.slashCommand = isTrueOrFalse(process.env.BOT_SLASH_COMMAND) ?? config.slashCommand;

    // Volume settings
    config.defaultVolume = (isNumber(process.env.DEFAULT_VOLUME) && Number(process.env.DEFAULT_VOLUME) !== 0) ? Number(process.env.DEFAULT_VOLUME) : config.defaultVolume;
    config.maxVolume = (isNumber(process.env.MAX_VOLUME) && Number(process.env.MAX_VOLUME) !== 0) ? Number(process.env.MAX_VOLUME) : config.maxVolume;

    // Auto leave channel settings
    config.autoLeave = isTrueOrFalse(process.env.AUTO_LEAVE) ?? config.autoLeave;
    config.autoLeaveCooldown = isNumber(process.env.AUTO_LEAVE_COOLDOWN) ? Number(process.env.AUTO_LEAVE_COOLDOWN) : config.autoLeaveCooldown;

    // Show voice channel updates
    config.displayVoiceState = isTrueOrFalse(process.env.DISPLAY_VOICE_STATE) ?? config.displayVoiceState;

    // Web dashboard settings
    config.enableSite = isTrueOrFalse(process.env.ENABLE_SITE) ?? config.enableSite;
    config.site.port = isNumber(process.env.SITE_PORT) ? Number(process.env.SITE_PORT) : config.site.port;
    config.site.loginType = (['USER', 'OAUTH2'].includes(String(process.env.SITE_LOGIN_TYPE)) ? String(process.env.SITE_LOGIN_TYPE) : config.site.loginType) as LoginType;
    config.site.username = process.env.SITE_USERNAME || config.site.username;
    config.site.password = hashGenerator.generateHash(process.env.SITE_PASSWORD || config.site.password);
    config.site.oauth2Link = process.env.SITE_OAUTH2_LINK || config.site.oauth2Link;
    config.site.oauth2RedirectUri = process.env.SITE_OAUTH2_REDIRECT_URI || config.site.oauth2RedirectUri;

    // Local Lavalink node
    config.enableLocalNode = isTrueOrFalse(process.env.ENABLE_LOCAL_NODE) ?? config.enableLocalNode;
    config.localNode.autoRestart = isTrueOrFalse(process.env.LOCAL_NODE_AUTO_RESTART) ?? config.localNode.autoRestart;
    config.localNode.downloadLink = process.env.LOCAL_NODE_DOWNLOAD_LINK || config.localNode.downloadLink;

    // console.log('setEnvironment: ', config);
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