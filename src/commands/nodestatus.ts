import i18next from 'i18next';
import { NodeState } from 'lavashark';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'nodestatus';
export const aliases = ['node', 'nodes', 'nodesstatus'];
export const description = i18next.t('commands:CONFIG_NODE_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_NODE_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'nodename',
        description: i18next.t('commands:CONFIG_NODE_OPTION_DESCRIPTION'),
        type: 3,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const nodes = client.lavashark.nodes;

    if (!args[0]) { // +node 
        const pingList = await client.lavashark.nodesPing();
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
        bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

        return message.reply({
            embeds: [embeds.nodesStatus(bot, unhealthValue, nodesStatus)],
            allowedMentions: { repliedUser: false }
        });
    }
    else { // +node [node name]
        const nodeName = args.join(' ');

        for (const node of nodes) {
            if (node.identifier === nodeName) {
                if (node.state !== NodeState.CONNECTED) {
                    return message.reply({
                        embeds: [embeds.nodeDisconnected(bot, nodeName)],
                        allowedMentions: { repliedUser: false }
                    });
                }

                const nodeInfoPromise = node.getInfo();
                const nodeStatsPromise = node.getStats();
                const nodePingPromise = client.lavashark.nodePing(node);
                const [nodeInfo, nodeStats, nodePing] = await Promise.all([nodeInfoPromise, nodeStatsPromise, nodePingPromise]);

                bot.logger.emit('log', bot.shardId, 'nodeInfo: ' + JSON.stringify(nodeInfo));
                bot.logger.emit('log', bot.shardId, 'nodeStats: ' + JSON.stringify(nodeStats));
                bot.logger.emit('log', bot.shardId, 'nodePing: ' + nodePing + 'ms');

                return message.reply({
                    embeds: [embeds.nodeStatus(bot, nodeName, nodeInfo, nodeStats, nodePing)],
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        let nodesName = '';
        for (const node of nodes) {
            nodesName += `\`${node.identifier}\`\n`;
        }

        return message.reply({
            embeds: [embeds.validNodeName(bot, nodesName)],
            allowedMentions: { repliedUser: false }
        });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const nodeName = interaction.options.getString('nodename');
    const nodes = client.lavashark.nodes;

    if (nodeName === null) { // /nodestatus
        const pingList = await client.lavashark.nodesPing();
        const nodesStatus = [];
        let unhealthValue = 0;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const ping = pingList[i];

            if (ping === -1) {
                nodesStatus.push({ name: `❌ ${node.identifier}`, value: 'DISCONNECTED' });
                unhealthValue++;
            }
            else {
                nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: ${ping}ms` });
            }
        }
        bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

        return interaction.editReply({
            embeds: [embeds.nodesStatus(bot, unhealthValue, nodesStatus)],
            allowedMentions: { repliedUser: false }
        });
    }
    else { // /nodestatus [node name]
        for (const node of nodes) {
            if (node.identifier === nodeName) {
                if (node.state !== NodeState.CONNECTED) {
                    return interaction.editReply({
                        embeds: [embeds.nodeDisconnected(bot, nodeName)],
                        allowedMentions: { repliedUser: false }
                    });
                }

                const nodeInfoPromise = node.getInfo();
                const nodeStatsPromise = node.getStats();
                const nodePingPromise = client.lavashark.nodePing(node);
                const [nodeInfo, nodeStats, nodePing] = await Promise.all([nodeInfoPromise, nodeStatsPromise, nodePingPromise]);

                bot.logger.emit('log', bot.shardId, 'nodeInfo: ' + JSON.stringify(nodeInfo));
                bot.logger.emit('log', bot.shardId, 'nodeStats: ' + JSON.stringify(nodeStats));
                bot.logger.emit('log', bot.shardId, 'nodePing: ' + nodePing + 'ms');

                return interaction.editReply({
                    embeds: [embeds.nodeStatus(bot, nodeName, nodeInfo, nodeStats, nodePing)],
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        let nodesName = '';
        for (const node of nodes) {
            nodesName += `\`${node.identifier}\`\n`;
        }

        return interaction.editReply({
            embeds: [embeds.validNodeName(bot, nodesName)],
            allowedMentions: { repliedUser: false }
        });
    }
};