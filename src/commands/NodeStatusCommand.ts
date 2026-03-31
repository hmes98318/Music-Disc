import i18next from 'i18next';
import { NodeState } from 'lavashark';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class NodeStatusCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'nodestatus',
            aliases: ['node', 'nodes', 'nodesstatus'],
            description: i18next.t('commands:CONFIG_NODE_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_NODE_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'nodename',
                    description: i18next.t('commands:CONFIG_NODE_OPTION_DESCRIPTION'),
                    type: 3,
                    required: false
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const nodeName = context.isInteraction()
            ? context.getStringOption('nodename')
            : context.args.join(' ');

        if (!nodeName) {
            // Show all nodes status
            await this.#showAllNodesStatus(bot, client, context);
        }
        else {
            // Show specific node status
            await this.#showNodeStatus(bot, client, context, nodeName);
        }
    }

    /**
     * Show all nodes status
     * @private
     */
    async #showAllNodesStatus(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const nodes = client.lavashark.nodes;
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

        await context.reply({
            embeds: [embeds.nodesStatus(bot, unhealthValue, nodesStatus)],
            allowedMentions: { repliedUser: false }
        });
    }

    /**
     * Show specific node status
     * @private
     */
    async #showNodeStatus(bot: Bot, client: Client, context: CommandContext, nodeName: string): Promise<void> {
        const nodes = client.lavashark.nodes;

        for (const node of nodes) {
            if (node.identifier === nodeName) {
                if (node.state !== NodeState.CONNECTED) {
                    await context.reply({
                        embeds: [embeds.nodeDisconnected(bot, nodeName)],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }

                const nodeInfoPromise = node.getInfo();
                const nodeStatsPromise = node.getStats();
                const nodePingPromise = client.lavashark.nodePing(node);
                const [nodeInfo, nodeStats, nodePing] = await Promise.all([
                    nodeInfoPromise,
                    nodeStatsPromise,
                    nodePingPromise
                ]);

                bot.logger.emit('log', bot.shardId, 'nodeInfo: ' + JSON.stringify(nodeInfo));
                bot.logger.emit('log', bot.shardId, 'nodeStats: ' + JSON.stringify(nodeStats));
                bot.logger.emit('log', bot.shardId, 'nodePing: ' + nodePing + 'ms');

                await context.reply({
                    embeds: [embeds.nodeStatus(bot, nodeName, nodeInfo, nodeStats, nodePing)],
                    allowedMentions: { repliedUser: false }
                });
                return;
            }
        }

        // Node not found - show available nodes
        let nodesName = '';
        for (const node of nodes) {
            nodesName += `\`${node.identifier}\`\n`;
        }

        await context.reply({
            embeds: [embeds.validNodeName(bot, nodesName)],
            allowedMentions: { repliedUser: false }
        });
    }
}
