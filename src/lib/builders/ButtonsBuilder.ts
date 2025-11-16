import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { cst } from '../../utils/constants.js';
import { DashboardButtonId, QueueButtonId } from '../../@types/index.js';

import type { Player } from 'lavashark';


/**
 * Builder class for creating button components
 */
export class ButtonsBuilder {
    /**
     * Creates a complete set of dashboard control buttons
     * @static
     * @param {Player} player - The lavashark player instance
     * @returns {ActionRowBuilder<ButtonBuilder>} ActionRow containing all dashboard buttons
     */
    public static createDashboardButtons(player: Player): ActionRowBuilder<ButtonBuilder> {
        const playing = !player.paused;

        const playPauseButton = new ButtonBuilder()
            .setCustomId(DashboardButtonId.PlayPause)
            .setEmoji(playing ? cst.button.pause : cst.button.play)
            .setStyle(playing ? ButtonStyle.Secondary : ButtonStyle.Success);

        const skipButton = new ButtonBuilder()
            .setCustomId(DashboardButtonId.Skip)
            .setEmoji(cst.button.skip)
            .setStyle(ButtonStyle.Secondary);

        const stopButton = new ButtonBuilder()
            .setCustomId(DashboardButtonId.Stop)
            .setEmoji(cst.button.stop)
            .setStyle(ButtonStyle.Danger);

        const loopButton = new ButtonBuilder()
            .setCustomId(DashboardButtonId.Loop)
            .setEmoji(cst.button.loop)
            .setStyle(ButtonStyle.Secondary);

        const shuffleButton = new ButtonBuilder()
            .setCustomId(DashboardButtonId.Shuffle)
            .setEmoji(cst.button.shuffle)
            .setStyle(ButtonStyle.Secondary);

        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);
    }

    /**
     * Creates queue pagination buttons
     * @static
     * @returns {ActionRowBuilder<ButtonBuilder>} ActionRow containing queue navigation buttons
     */
    public static createQueueButtons(): ActionRowBuilder<ButtonBuilder> {
        const prevButton = new ButtonBuilder()
            .setCustomId(QueueButtonId.Previous)
            .setEmoji(cst.button.prev)
            .setStyle(ButtonStyle.Secondary);

        const nextButton = new ButtonBuilder()
            .setCustomId(QueueButtonId.Next)
            .setEmoji(cst.button.next)
            .setStyle(ButtonStyle.Secondary);

        const delButton = new ButtonBuilder()
            .setCustomId(QueueButtonId.Delete)
            .setLabel(cst.button.delete)
            .setStyle(ButtonStyle.Primary);

        const clsButton = new ButtonBuilder()
            .setCustomId(QueueButtonId.Clear)
            .setLabel(cst.button.clear)
            .setStyle(ButtonStyle.Danger);

        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(prevButton, nextButton, delButton, clsButton);
    }
}
