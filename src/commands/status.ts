import { embeds } from '../embeds';
import { uptime } from '../utils/functions/uptime';
import { sysusage } from '../utils/functions/sysusage';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot, SystemStatus } from '../@types';


export const name = 'status';
export const aliases = ['info'];
export const description = 'Show the bot status';
export const usage = 'status';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const botPing = `${Date.now() - message.createdTimestamp}ms`;

    const [sysloadResult, pingListResult, guildsCountResult, guildsCacheResult, playerCountResult] = await Promise.allSettled([
        sysusage.cpu(),
        client.lavashark.nodesPing(),
        client.shard?.fetchClientValues('guilds.cache.size').catch(() => [-1]),
        client.shard?.fetchClientValues('guilds.cache').catch(() => [[]]),
        client.shard?.fetchClientValues('lavashark.players.size').catch(() => [-1])
    ]);

    const sysload = sysloadResult.status === 'fulfilled' ? sysloadResult.value : { percent: '0%', detail: '[0.00, 0.00, 0.00]' };
    const pingList = pingListResult.status === 'fulfilled' ? pingListResult.value : [];
    const totalGuildsCount = guildsCountResult.status === 'fulfilled' ?
        (guildsCountResult.value as number[]).reduce((total: number, count: number) => total + count, 0) : 0;
    const totalMembersCount = guildsCacheResult.status === 'fulfilled' ?
        (guildsCacheResult.value as []).flat().reduce((acc, guild) => acc + (guild ? (guild as any).memberCount : 0), 0) : 0;
    const totalPlayerCount = playerCountResult.status === 'fulfilled' ?
        (playerCountResult.value as number[]).reduce((total: number, count: number) => total + count, 0) : 0;

    console.log('guilds count: ' + totalGuildsCount, guildsCountResult.status === 'fulfilled' ? guildsCountResult.value : []);
    console.log('members count: ' + totalMembersCount, guildsCacheResult.status === 'fulfilled' ? (guildsCacheResult.value as unknown as []).map((guilds: any) => guilds.reduce((acc: any, guild: any) => acc + (guild ? (guild as any).memberCount : 0), 0)) : []);
    console.log('lavashark player: ' + totalPlayerCount, playerCountResult.status === 'fulfilled' ? playerCountResult.value : []);


    const systemStatus: SystemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: totalGuildsCount,
        totalMembers: totalMembersCount,
        playing: totalPlayerCount
    };

    const nodes = client.lavashark.nodes;
    const nodesStatus = [];
    let healthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            healthValue++;
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
        }
    }
    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;


    return message.reply({
        embeds: [
            embeds.botStatus(bot.config, bot.sysInfo, systemStatus),
            embeds.nodesStatus(bot.config.embedsColor, nodeHealth, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const botPing = `${Date.now() - interaction.createdTimestamp}ms`;

    const [sysloadResult, pingListResult, guildsCountResult, guildsCacheResult, playerCountResult] = await Promise.allSettled([
        sysusage.cpu(),
        client.lavashark.nodesPing(),
        client.shard?.fetchClientValues('guilds.cache.size').catch(() => [-1]),
        client.shard?.fetchClientValues('guilds.cache').catch(() => [[]]),
        client.shard?.fetchClientValues('lavashark.players.size').catch(() => [-1])
    ]);

    const sysload = sysloadResult.status === 'fulfilled' ? sysloadResult.value : { percent: '0%', detail: '[0.00, 0.00, 0.00]' };
    const pingList = pingListResult.status === 'fulfilled' ? pingListResult.value : [];
    const totalGuildsCount = guildsCountResult.status === 'fulfilled' ?
        (guildsCountResult.value as number[]).reduce((total: number, count: number) => total + count, 0) : 0;
    const totalMembersCount = guildsCacheResult.status === 'fulfilled' ?
        (guildsCacheResult.value as []).flat().reduce((acc, guild) => acc + (guild ? (guild as any).memberCount : 0), 0) : 0;
    const totalPlayerCount = playerCountResult.status === 'fulfilled' ?
        (playerCountResult.value as number[]).reduce((total: number, count: number) => total + count, 0) : 0;

    console.log('guilds count: ' + totalGuildsCount, guildsCountResult.status === 'fulfilled' ? guildsCountResult.value : []);
    console.log('members count: ' + totalMembersCount, guildsCacheResult.status === 'fulfilled' ? (guildsCacheResult.value as unknown as []).map((guilds: any) => guilds.reduce((acc: any, guild: any) => acc + (guild ? (guild as any).memberCount : 0), 0)) : []);
    console.log('lavashark player: ' + totalPlayerCount, playerCountResult.status === 'fulfilled' ? playerCountResult.value : []);


    const systemStatus: SystemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: totalGuildsCount,
        totalMembers: totalMembersCount,
        playing: totalPlayerCount
    };

    const nodes = client.lavashark.nodes;
    const nodesStatus = [];
    let healthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            healthValue++;
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
        }
    }
    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;


    return interaction.editReply({
        embeds: [
            embeds.botStatus(bot.config, bot.sysInfo, systemStatus),
            embeds.nodesStatus(bot.config.embedsColor, nodeHealth, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};