import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Collection } from 'discord.js';
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
    private static readonly LOOP_MODES = ['Off', 'Single', 'All'];

    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check loop permission
        if (!this.checkPermission(bot, interaction, 'loop', player)) {
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(DashboardButtonId.LoopSelect)
            .setPlaceholder('Select the loop mode')
            .setOptions(this.LOOP_MODES.map(mode => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(mode)
                    .setDescription(`Set loop mode to ${mode}`)
                    .setValue(mode)
            ));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await interaction.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('events:MESSAGE_SELECT_LOOP_MODE'))],
            ephemeral: true,
            components: [row]
        });

        const collector = interaction.channel!.createMessageComponentCollector({
            time: 20000,
            max: 1,
            filter: (i: any) => i.user.id === interaction.user.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            const selectedMode = i.values[0];
            let mode = 0;

            switch (selectedMode) {
                case 'Off':
                    mode = RepeatMode.OFF;
                    break;
                case 'Single':
                    mode = RepeatMode.TRACK;
                    break;
                case 'All':
                    mode = RepeatMode.QUEUE;
                    break;
            }

            player.setRepeatMode(mode);

            const buttonRow = ButtonsBuilder.createDashboardButtons(player);
            await player.dashboardMsg?.edit({ components: [buttonRow] });

            await i.update({
                embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_SET_LOOP_MODE', { mode: selectedMode }))],
                components: []
            });
        });

        collector.on('end', async (collected: Collection<string, StringSelectMenuInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: []
                }).catch(() => {});
            }
        });
    }
}
