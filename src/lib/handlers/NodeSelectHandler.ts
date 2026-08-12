import { ActionRowBuilder, MessageFlags, StringSelectMenuBuilder } from 'discord.js';
import { NodeState } from 'lavashark';

import { embeds } from '../../embeds/index.js';

import type { Client, StringSelectMenuInteraction } from 'discord.js';
import type { Bot } from '../../@types/index.js';

export class NodeSelectHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: StringSelectMenuInteraction
    ): Promise<void> {
        if (interaction.customId !== 'select_node') return;

        const lng = bot.guildLanguageManager?.get(interaction.guildId!) || bot.config.bot.i18n.defaultLocale;
        const nodeName = interaction.values[0];
        const nodes = client.lavashark.nodes;

        const targetNode = nodes.find(node => node.identifier === nodeName);

        if (!targetNode) {
            await interaction.reply({
                embeds: [embeds.validNodeName(bot, nodes.map(n => `\`${n.identifier}\``).join('\n'), lng)],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (targetNode.state !== NodeState.CONNECTED) {
            await interaction.reply({
                embeds: [embeds.nodeDisconnected(bot, nodeName, lng)],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferUpdate();

        try {
            const [nodeInfo, nodeStats, nodePing] = await Promise.all([
                targetNode.getInfo(),
                targetNode.getStats(),
                client.lavashark.nodePing(targetNode)
            ]);

            const selectOptions = nodes.slice(0, 25).map(node => {
                const isConnected = node.state === NodeState.CONNECTED;
                return {
                    label: node.identifier,
                    value: node.identifier,
                    default: node.identifier === nodeName,
                    description: isConnected
                        ? (bot.i18n.t('embeds:NODE_STATUS_PING', { lng }) + `: ${nodePing}ms`)
                        : bot.i18n.t('embeds:NODE_DISCONNECTED', { lng }).replace(/\*/g, ''),
                    emoji: isConnected ? '✅' : '❌'
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_node')
                .setPlaceholder(bot.i18n.t('commands:CONFIG_NODE_OPTION_DESCRIPTION', { lng }))
                .addOptions(selectOptions);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.editReply({
                embeds: [embeds.nodeStatus(bot, nodeName, nodeInfo, nodeStats, nodePing, lng)],
                components: [row]
            });
        } catch (error) {
            bot.logger.error(bot.shardId, '[NodeSelectHandler] Error fetching node status: ' + error);
        }
    }
}
