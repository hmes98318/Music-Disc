import * as dotenv from 'dotenv';
import { hashGenerator } from '../lib/hashGenerator';
import type { Bot, LoginType } from '../../@types';


dotenv.config();

const setEnvironment = (bot: Bot) => {
    // Admin of the bot
    bot.config.admin = process.env.BOT_ADMIN || bot.config.admin;
    bot.config.clientSecret = process.env.BOT_CLIENT_SECRET || bot.config.clientSecret;

    // Bot settings
    bot.config.name = process.env.BOT_NAME || bot.config.name;
    bot.config.prefix = process.env.BOT_PREFIX || bot.config.prefix;
    bot.config.status = ['online', 'idle', 'dnd'].includes(String(process.env.BOT_STATUS)) ? String(process.env.BOT_STATUS) : bot.config.status;
    bot.config.playing = process.env.BOT_PLAYING || bot.config.playing;
    bot.config.embedsColor = process.env.BOT_EMBEDS_COLOR || bot.config.embedsColor;

    // Volume settings
    bot.config.defaultVolume = (isNumber(process.env.DEFAULT_VOLUME) && Number(process.env.DEFAULT_VOLUME) !== 0) ? Number(process.env.DEFAULT_VOLUME) : bot.config.defaultVolume;
    bot.config.maxVolume = (isNumber(process.env.MAX_VOLUME) && Number(process.env.MAX_VOLUME) !== 0) ? Number(process.env.MAX_VOLUME) : bot.config.maxVolume;

    // Auto leave channel settings
    bot.config.autoLeave = isTrueOrFalse(process.env.AUTO_LEAVE) ?? bot.config.autoLeave;
    bot.config.autoLeaveCooldown = isNumber(process.env.AUTO_LEAVE_COOLDOWN) ? Number(process.env.AUTO_LEAVE_COOLDOWN) : bot.config.autoLeaveCooldown;

    // Show voice channel updates
    bot.config.displayVoiceState = isTrueOrFalse(process.env.DISPLAY_VOICE_STATE) ?? bot.config.displayVoiceState;

    // Web dashboard settings
    bot.config.enableSite = isTrueOrFalse(process.env.ENABLE_SITE) ?? bot.config.enableSite;
    bot.config.site.port = isNumber(process.env.SITE_PORT) ? Number(process.env.SITE_PORT) : bot.config.site.port;
    bot.config.site.loginType = (['USER', 'OAUTH2'].includes(String(process.env.SITE_LOGIN_TYPE)) ? String(process.env.SITE_LOGIN_TYPE) : bot.config.site.loginType) as LoginType;
    bot.config.site.username = process.env.SITE_USERNAME || bot.config.site.username;
    bot.config.site.password = hashGenerator.generateHash(process.env.SITE_PASSWORD || bot.config.site.password);
    bot.config.site.oauth2Link = process.env.SITE_OAUTH2_LINK || bot.config.site.oauth2Link;
    bot.config.site.oauth2RedirectUri = process.env.SITE_OAUTH2_REDIRECT_URI || bot.config.site.oauth2RedirectUri;

    // Local Lavalink node
    bot.config.enableLocalNode = isTrueOrFalse(process.env.ENABLE_LOCAL_NODE) ?? bot.config.enableLocalNode;
    bot.config.localNode.autoRestart = isTrueOrFalse(process.env.LOCAL_NODE_AUTO_RESTART) ?? bot.config.localNode.autoRestart;
    bot.config.localNode.downloadLink = process.env.LOCAL_NODE_DOWNLOAD_LINK || bot.config.localNode.downloadLink;

    // console.log('setEnvironment: ', config);
    bot.logger.emit('log', 'Set environment variables.');
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