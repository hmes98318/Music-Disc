import i18next from 'i18next';

import { cst } from '../utils/constants.js';
import { embeds } from '../embeds/index.js';
import { uptime } from '../utils/functions/uptime.js';
import { sysusage } from '../utils/functions/sysusage.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot, SystemStatus } from '../@types/index.js';


export const name = 'status';
export const aliases = ['info'];
export const description = i18next.t('commands:CONFIG_STATUS_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_STATUS_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const botPing = `${Date.now() - message.createdTimestamp}ms`;
    const sysload = await sysusage.cpu();
    const pingList = await client.lavashark.nodesPing();

    const nodes = client.lavashark.nodes;
    const nodesStatus = [];
    let unhealthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            unhealthValue++;
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
        }
    }


    const results = await client.shard!.broadcastEval(async (client) => {
        return {
            playing: client.lavashark.players.size
        };
    });

    if (!bot.stats.lastRefresh || ((Date.now() - bot.stats.lastRefresh) > cst.cacheExpiration)) {
        try {
            const results = await client.shard!.broadcastEval(async (client) => {
                await client.guilds.fetch();

                return {
                    serverCount: client.guilds.cache.size,
                    totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
                };
            });


            bot.stats.guildsCount = results.map((shard) => shard.serverCount) || bot.stats.guildsCount;
            bot.stats.lastRefresh = Date.now();

        } catch (error) {
            bot.logger.emit('api', `[${bot.shardId}] Failed to get shard info: ${error}`);
        }
    }


    const totalServerCount = bot.stats.guildsCount.reduce((acc, guilds) => acc + guilds, 0);
    const totalPlaying = results.reduce((acc, shard) => acc + shard.playing, 0);

    const systemStatus: SystemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: totalServerCount,
        playing: totalPlaying
    };


    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

    return message.reply({
        embeds: [
            embeds.botStatus(bot, systemStatus),
            embeds.nodesStatus(bot, unhealthValue, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
    const sysload = await sysusage.cpu();
    const pingList = await client.lavashark.nodesPing();

    const nodes = client.lavashark.nodes;
    const nodesStatus = [];
    let unhealthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            unhealthValue++;
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
        }
    }


    const results = await client.shard!.broadcastEval(async (client) => {
        return {
            playing: client.lavashark.players.size
        };
    });

    if (!bot.stats.lastRefresh || ((Date.now() - bot.stats.lastRefresh) > cst.cacheExpiration)) {
        try {
            const results = await client.shard!.broadcastEval(async (client) => {
                await client.guilds.fetch();

                return {
                    serverCount: client.guilds.cache.size,
                    totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
                };
            });


            bot.stats.guildsCount = results.map((shard) => shard.serverCount) || bot.stats.guildsCount;
            bot.stats.lastRefresh = Date.now();

        } catch (error) {
            bot.logger.emit('api', `[${bot.shardId}] Failed to get shard info: ${error}`);
        }
    }


    const totalServerCount = bot.stats.guildsCount.reduce((acc, guilds) => acc + guilds, 0);
    const totalPlaying = results.reduce((acc, shard) => acc + shard.playing, 0);

    const systemStatus: SystemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: totalServerCount,
        playing: totalPlaying
    };


    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

    return interaction.editReply({
        embeds: [
            embeds.botStatus(bot, systemStatus),
            embeds.nodesStatus(bot, unhealthValue, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};