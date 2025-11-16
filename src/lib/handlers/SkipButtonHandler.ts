import { RepeatMode } from 'lavashark';
import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';

import type { Client, ButtonInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for Dashboard Skip button
 */
export class SkipButtonHandler extends DashboardButtonHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check skip permission
        if (!this.checkPermission(bot, interaction, 'skip', player)) {
            return;
        }

        const repeatMode = player.repeatMode;

        if (repeatMode === RepeatMode.TRACK) {
            player.setRepeatMode(RepeatMode.OFF);
            await player.skip();
            player.setRepeatMode(RepeatMode.TRACK);
        } else {
            await player.skip();
        }

        const row = ButtonsBuilder.createDashboardButtons(player);
        await interaction.update({ components: [row] });
    }
}
