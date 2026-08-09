import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Collection, MessageFlags } from 'discord.js';
import { RepeatMode } from 'lavashark';
import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';
import { DashboardButtonId } from '../../@types/index.js';
import { embeds } from '../../embeds/index.js';

import type { Client, ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for Dashboard Loop button
 */
export class LoopButtonHandler extends DashboardButtonHandler {
    private static readonly LOOP_MODE_VALUES = ['off', 'single', 'all'] as const;

    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check loop permission
        if (!await this.checkPermission(bot, client, interaction, 'loop', player)) {
            return;
        }

        const lng = bot.guildLanguageManager?.get(interaction.guildId!);
        const currentRepeatMode = player.repeatMode;

        const modeLabels = [
            bot.i18n.t('events:LOOP_MODE_OFF', { lng }),
            bot.i18n.t('events:LOOP_MODE_SINGLE', { lng }),
            bot.i18n.t('events:LOOP_MODE_ALL', { lng })
        ];

        const select = new StringSelectMenuBuilder()
            .setCustomId(DashboardButtonId.LoopSelect)
            .setPlaceholder(bot.i18n.t('commands:LOOP_SELECT_PLACEHOLDER', { lng }))
            .setOptions(this.LOOP_MODE_VALUES.map((value, index) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(modeLabels[index])
                    .setDescription(bot.i18n.t('commands:LOOP_SELECT_DESCRIPTION', { mode: modeLabels[index], lng }))
                    .setValue(value)
                    .setDefault(index === currentRepeatMode)
            ));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await interaction.reply({
            embeds: [embeds.textMsg(bot, bot.i18n.t('events:MESSAGE_SELECT_LOOP_MODE', { lng }))],
            flags: MessageFlags.Ephemeral,
            components: [row]
        });

        const collector = interaction.channel!.createMessageComponentCollector({
            time: 20000,
            max: 1,
            filter: (i: any) => i.user.id === interaction.user.id && i.customId === DashboardButtonId.LoopSelect
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            const currentLng = bot.guildLanguageManager?.get(i.guildId!) || lng;
            const updatedModeLabels = [
                bot.i18n.t('events:LOOP_MODE_OFF', { lng: currentLng }),
                bot.i18n.t('events:LOOP_MODE_SINGLE', { lng: currentLng }),
                bot.i18n.t('events:LOOP_MODE_ALL', { lng: currentLng })
            ];

            const selectedValue = i.values[0];
            let mode = 0;
            let modeLabel = updatedModeLabels[0];

            switch (selectedValue) {
                case 'off':
                    mode = RepeatMode.OFF;
                    modeLabel = updatedModeLabels[0];
                    break;
                case 'single':
                    mode = RepeatMode.TRACK;
                    modeLabel = updatedModeLabels[1];
                    break;
                case 'all':
                    mode = RepeatMode.QUEUE;
                    modeLabel = updatedModeLabels[2];
                    break;
            }

            player.setRepeatMode(mode);

            if (player.current && client.dashboard) {
                await client.dashboard.update(player, player.current);
            } else {
                const buttonRow = ButtonsBuilder.createDashboardButtons(player, currentLng);
                await player.dashboardMsg?.edit({ components: [buttonRow] });
            }

            await i.update({
                embeds: [embeds.textSuccessMsg(bot, bot.i18n.t('events:MESSAGE_SET_LOOP_MODE', { mode: modeLabel, lng: currentLng }))],
                components: []
            });
        });

        collector.on('end', async (collected: Collection<string, StringSelectMenuInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                const currentLng = bot.guildLanguageManager?.get(interaction.guildId!) || lng;
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, bot.i18n.t('commands:ERROR_TIME_EXPIRED', { lng: currentLng }))],
                    components: []
                }).catch(() => {});
            }
        });
    }
}
