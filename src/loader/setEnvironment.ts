import { ActivityType } from 'discord.js';
import { hashGenerator } from '../lib/hashGenerator.js';
import { config } from '../../config.js';
import { DJModeEnum } from './../@types/index.js';

import type { Config } from './../@types/index.js';


const setEnvironment = (defaultConfig: Config) => {
    defaultConfig.bot = {
        textCommand: config.bot.textCommand ?? defaultConfig.bot.textCommand,
        slashCommand: config.bot.slashCommand ?? defaultConfig.bot.slashCommand,

        // Admin of the bot (user_id[])
        admin: (Array.isArray(config.bot.admin) && config.bot.admin.length > 0)
            ? config.bot.admin
            : defaultConfig.bot.admin,
        // DJ of the bot (user_id[])
        dj: (Array.isArray(config.bot.dj) && config.bot.dj.length > 0)
            ? config.bot.dj
            : defaultConfig.bot.dj,
        djRoleId: (/^\d+$/).test(String(config.bot.djRoleId))
            ? String(config.bot.djRoleId)
            : defaultConfig.bot.djRoleId,
        djMode: Object.values(DJModeEnum).includes(config.bot.djMode as any)
            ? config.bot.djMode
            : defaultConfig.bot.djMode,
        djLeaveCooldown: isNumber(config.bot.djLeaveCooldown)
            ? config.bot.djLeaveCooldown
            : defaultConfig.bot.djLeaveCooldown,

        clientSecret: config.bot.clientSecret || defaultConfig.bot.clientSecret,

        // Bot settings
        name: config.bot.name || defaultConfig.bot.name,
        prefix: config.bot.prefix || defaultConfig.bot.prefix,
        status: ['online', 'idle', 'dnd'].includes(config.bot.status)
            ? config.bot.status
            : defaultConfig.bot.status,
        activity: {
            name: config.bot.activity.name || defaultConfig.bot.activity.name,
            type: Object.values(ActivityType).includes(config.bot.activity.type)
                ? config.bot.activity.type
                : defaultConfig.bot.activity.type,
            state: config.bot.activity.state || defaultConfig.bot.activity.state,
            url: config.bot.activity.url || defaultConfig.bot.activity.url,
        },
        embedsColors: {
            message: config.bot.embedsColors.message || defaultConfig.bot.embedsColors.message,
            success: config.bot.embedsColors.success || defaultConfig.bot.embedsColors.success,
            error: config.bot.embedsColors.error || defaultConfig.bot.embedsColors.error,
            warning: config.bot.embedsColors.warning || defaultConfig.bot.embedsColors.warning
        },

        // Volume settings
        volume: {
            default: isNumber(config.bot.volume.default)
                ? config.bot.volume.default
                : defaultConfig.bot.volume.default,
            max: isNumber(config.bot.volume.max)
                ? config.bot.volume.max
                : defaultConfig.bot.volume.max
        },

        // Auto leave channel settings
        autoLeave: {
            enabled: config.bot.autoLeave.enabled ?? defaultConfig.bot.autoLeave.enabled,
            cooldown: isNumber(config.bot.autoLeave.cooldown)
                ? config.bot.autoLeave.cooldown
                : defaultConfig.bot.autoLeave.cooldown
        },

        // Show voice channel updates
        displayVoiceState: config.bot.displayVoiceState ?? defaultConfig.bot.displayVoiceState,

        specifyMessageChannel: (/^\d+$/).test(String(config.bot.specifyMessageChannel))
            ? String(config.bot.specifyMessageChannel)
            : defaultConfig.bot.specifyMessageChannel,

        specifyVoiceChannel: (/^\d+$/).test(String(config.bot.specifyVoiceChannel))
            ? String(config.bot.specifyVoiceChannel)
            : defaultConfig.bot.specifyVoiceChannel,

        startupAutoJoin: ((/^\d+$/).test(String(config.bot.specifyVoiceChannel)) && config.bot.startupAutoJoin),

        i18n: {
            localePath: config.bot.i18n.localePath || defaultConfig.bot.i18n.localePath,
            defaultLocale: config.bot.i18n.defaultLocale || defaultConfig.bot.i18n.defaultLocale
        }
    };

    // Lavalink node list
    defaultConfig.nodeList = (Array.isArray(config.nodeList) && config.nodeList.length > 0)
        ? config.nodeList
        : defaultConfig.nodeList;

    // Spotify credentials
    defaultConfig.spotify = {
        clientId: config.spotify.clientId || defaultConfig.spotify.clientId,
        clientSecret: config.spotify.clientSecret || defaultConfig.spotify.clientSecret
    };

    defaultConfig.blacklist = (Array.isArray(config.blacklist) && config.blacklist.length > 0)
        ? config.blacklist
        : defaultConfig.blacklist;

    // Web dashboard settings
    defaultConfig.webDashboard = {
        enabled: config.webDashboard.enabled ?? defaultConfig.webDashboard.enabled,
        port: isNumber(config.webDashboard.port)
            ? config.webDashboard.port
            : defaultConfig.webDashboard.port,
        loginType: ['USER', 'OAUTH2'].includes(config.webDashboard.loginType)
            ? config.webDashboard.loginType
            : defaultConfig.webDashboard.loginType,

        user: {
            username: config.webDashboard.user.username || defaultConfig.webDashboard.user.username,
            password: hashGenerator.generateHash(config.webDashboard.user.password || defaultConfig.webDashboard.user.password)
        },
        oauth2: {
            link: config.webDashboard.oauth2.link || defaultConfig.webDashboard.oauth2.link,
            redirectUri: config.webDashboard.oauth2.redirectUri || defaultConfig.webDashboard.oauth2.redirectUri
        },

        sessionManager: {
            validTime: config.webDashboard.sessionManager.validTime ?? defaultConfig.webDashboard.sessionManager.validTime,
            cleanupInterval: config.webDashboard.sessionManager.cleanupInterval ?? defaultConfig.webDashboard.sessionManager.cleanupInterval,
        },
        ipBlocker: {
            retryLimit: config.webDashboard.ipBlocker.retryLimit ?? defaultConfig.webDashboard.ipBlocker.retryLimit,
            unlockTimeoutDuration: config.webDashboard.ipBlocker.unlockTimeoutDuration ?? defaultConfig.webDashboard.ipBlocker.unlockTimeoutDuration,
            cleanupInterval: config.webDashboard.ipBlocker.cleanupInterval ?? defaultConfig.webDashboard.ipBlocker.cleanupInterval,
        }
    };

    // Local Lavalink node
    defaultConfig.localNode = {
        enabled: config.localNode.enabled ?? defaultConfig.localNode.enabled,
        autoRestart: config.localNode.autoRestart ?? defaultConfig.localNode.autoRestart,
        downloadLink: config.localNode.downloadLink || defaultConfig.localNode.downloadLink
    };

    defaultConfig.command = {
        disableCommand: Array.isArray(config.command.disableCommand)
            ? config.command.disableCommand
            : defaultConfig.command.disableCommand,
        adminCommand: Array.isArray(config.command.adminCommand)
            ? config.command.adminCommand
            : defaultConfig.command.adminCommand,
        djCommand: Array.isArray(config.command.djCommand)
            ? config.command.djCommand
            : defaultConfig.command.djCommand,
    };
};

export { setEnvironment };


const isNumber = (value: any): boolean => {
    return (typeof (value) === 'number' && !isNaN(value));
};
