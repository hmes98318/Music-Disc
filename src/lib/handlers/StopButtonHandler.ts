import { RepeatMode } from 'lavashark';
import { DashboardButtonHandler } from './DashboardButtonHandler.js';

import type { Client, ButtonInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';

/**
 * Handler for Dashboard Stop button
 */
export class StopButtonHandler extends DashboardButtonHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check leave permission
        if (!await this.checkPermission(bot, client, interaction, 'leave', player)) {
            return;
        }

        // Clean up queue persistence before stopping
        if (bot.config.queuePersistence.enabled && client.queuePersistence) {
            client.queuePersistence.stopPeriodicSave(player.guildId);
            client.queuePersistence.deleteQueue(player.guildId);
        }

        // Turn off repeat mode before clearing queue to prevent track re-playback on skip
        if (player.repeatMode !== RepeatMode.OFF) {
            player.setRepeatMode(RepeatMode.OFF);
        }

        player.queue.clear();
        await player.skip();
        await client.dashboard.destroy(player);

        await interaction.deferUpdate();
    }
}


