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
    const sysload = await sysusage.cpu();
    const pingList = await client.lavashark.nodesPing();

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

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;


    const results = await client.shard!.broadcastEval(async (client) => {
        return {
            serverCount: client.guilds.cache.size,
            totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            playing: client.lavashark.players.size
        };
    });


    const totalServerCount = results.reduce((acc, shard) => acc + shard.serverCount, 0);
    const totalMemberCount = results.reduce((acc, shard) => acc + shard.totalMembers, 0);
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
        totalMembers: totalMemberCount,
        playing: totalPlaying
    };


    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

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
    const sysload = await sysusage.cpu();
    const pingList = await client.lavashark.nodesPing();

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

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;


    const results = await client.shard!.broadcastEval(async (client) => {
        return {
            serverCount: client.guilds.cache.size,
            totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            playing: client.lavashark.players.size
        };
    });


    const totalServerCount = results.reduce((acc, shard) => acc + shard.serverCount, 0);
    const totalMemberCount = results.reduce((acc, shard) => acc + shard.totalMembers, 0);
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
        totalMembers: totalMemberCount,
        playing: totalPlaying
    };


    bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

    return interaction.editReply({
        embeds: [
            embeds.botStatus(bot.config, bot.sysInfo, systemStatus),
            embeds.nodesStatus(bot.config.embedsColor, nodeHealth, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};