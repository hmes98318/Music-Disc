import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';

import type { Client, ButtonInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for Dashboard PlayPause button
 */
export class PlayPauseButtonHandler extends DashboardButtonHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check permissions for both pause and resume commands
        if (!this.checkPermission(bot, interaction, 'pause', player) || 
            !this.checkPermission(bot, interaction, 'resume', player)) {
            return;
        }

        const playing = !player.paused;

        if (playing) {
            await player.pause();
        } else {
            await player.resume();
        }

        const row = ButtonsBuilder.createDashboardButtons(player);
        await interaction.update({ components: [row] });
    }
}
