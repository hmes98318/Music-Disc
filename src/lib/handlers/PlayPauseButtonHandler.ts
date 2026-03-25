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
        const playing = !player.paused;

        // Check permission for the relevant command
        const commandToCheck = playing ? 'pause' : 'resume';
        if (!this.checkPermission(bot, interaction, commandToCheck, player)) {
            return;
        }

        if (playing) {
            await player.pause();
        } else {
            await player.resume();
        }

        const row = ButtonsBuilder.createDashboardButtons(player);
        await interaction.update({ components: [row] });
    }
}
