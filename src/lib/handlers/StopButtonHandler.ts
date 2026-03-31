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
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            (client as any).queuePersistence.stopPeriodicSave(player.guildId);
            (client as any).queuePersistence.deleteQueue(player.guildId);
        }

        if (bot.config.bot.autoLeave.enabled) {
            player.destroy();
        } else {
            player.queue.clear();
            await player.skip();
            await client.dashboard.destroy(player);
        }

        await interaction.deferUpdate();
    }
}
