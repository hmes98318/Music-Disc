import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { embeds } from '../../embeds/index.js';

import type { Client, ButtonInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for Dashboard Shuffle button
 */
export class ShuffleButtonHandler extends DashboardButtonHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check shuffle permission
        if (!this.checkPermission(bot, interaction, 'shuffle', player)) {
            return;
        }

        player.queue.shuffle();

        await interaction.reply({
            embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_MUSIC_SHUFFLE'))],
            ephemeral: true,
            components: []
        });
    }
}
