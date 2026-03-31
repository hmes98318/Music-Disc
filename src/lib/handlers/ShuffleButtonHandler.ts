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
        if (!await this.checkPermission(bot, client, interaction, 'shuffle', player)) {
            return;
        }

        player.queue.shuffle();

        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            await (client as any).queuePersistence.saveQueue(player);
        }

        await interaction.reply({
            embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_MUSIC_SHUFFLE'))],
            ephemeral: true,
            components: []
        });
    }
}
