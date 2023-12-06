import { embeds } from "../embeds";
import { uptime } from "../utils/functions/uptime";
import { sysusage } from "../utils/functions/sysusage";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


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

    const systemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: client.guilds.cache.size,
        playing: client.lavashark.players.size
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
    bot.logger.emit('log', 'nodesStatus: ' + JSON.stringify(nodesStatus));

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
    const sysload = await sysusage.cpu();
    const pingList = await client.lavashark.nodesPing();

    const systemStatus = {
        load: sysload,
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(bot.sysInfo.startupTime),
        ping: {
            bot: botPing,
            api: client.ws.ping
        },
        serverCount: client.guilds.cache.size,
        playing: client.lavashark.players.size
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
    bot.logger.emit('log', 'nodesStatus: ' + JSON.stringify(nodesStatus));

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;


    return interaction.editReply({
        embeds: [
            embeds.botStatus(bot.config, bot.sysInfo, systemStatus),
            embeds.nodesStatus(bot.config.embedsColor, nodeHealth, nodesStatus)
        ],
        allowedMentions: { repliedUser: false }
    });
};