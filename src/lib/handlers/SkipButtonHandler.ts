import { RepeatMode } from 'lavashark';
import { MessageFlags } from 'discord.js';
import { DashboardButtonHandler } from './DashboardButtonHandler.js';
import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';
import { PermissionManager } from '../PermissionManager.js';
import { embeds } from '../../embeds/index.js';

import type { Client, ButtonInteraction, GuildMember } from 'discord.js';
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
        if (!await this.checkPermission(bot, client, interaction, 'skip', player)) {
            return;
        }

        // Check if skip is restricted to requester only
        if (bot.config.command.requesterOnly.includes('skip')) {
            const currentTrack = player.current;
            const userId = interaction.user.id;

            // Check if user is the requester
            const isRequester = currentTrack?.requester?.id === userId;

            // Check if user is admin (admins can always skip)
            const isAdmin = bot.config.bot.admin.includes(userId);

            // Check if user is DJ and DJ bypass is enabled for skip
            const member = interaction.member as GuildMember | null;
            const isDJ = PermissionManager.hasDJCommandPermission(bot, userId, member, player);
            const canDJBypass = bot.config.command.requesterDjBypass.includes('skip') && isDJ;

            // Deny skip if user is not requester and doesn't have bypass permissions
            if (!isRequester && !isAdmin && !canDJBypass) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_SKIP_NOT_REQUESTER'))],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
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
