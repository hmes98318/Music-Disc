import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';
import { PermissionManager } from '../PermissionManager.js';
import { embeds } from '../../embeds/index.js';

import type { Client, ButtonInteraction, GuildMember } from 'discord.js';
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
        if (!await this.checkPermission(bot, client, interaction, commandToCheck, player)) {
            return;
        }

        // Check if pause is restricted to requester only (only applies when pausing, not resuming)
        if (playing && bot.config.command.requesterOnly.includes('pause')) {
            const currentTrack = player.current;
            const userId = interaction.user.id;
            const isRequester = currentTrack?.requester?.id === userId;
            const isAdmin = bot.config.bot.admin.includes(userId);
            const member = interaction.member as GuildMember | null;
            const isDJ = PermissionManager.hasDJCommandPermission(bot, userId, member, player);
            const canDJBypass = bot.config.command.requesterDjBypass.includes('pause') && isDJ;
            if (!isRequester && !isAdmin && !canDJBypass) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PAUSE_NOT_REQUESTER'))],
                    ephemeral: true
                });
                return;
            }
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
