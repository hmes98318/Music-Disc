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
        if (!this.checkPermission(bot, interaction, 'leave', player)) {
            return;
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
