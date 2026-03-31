import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { PermissionManager } from '../lib/PermissionManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


/**
 * Pause command - Pauses music playback
 */
export class PauseCommand extends BaseCommand {
    getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'pause',
            aliases: [],
            description: i18next.t('commands:CONFIG_PAUSE_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_PAUSE_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guildId!);

        if (!player || !player.playing) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        if (player.paused) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_PAUSE_MUSIC_PAUSED'));
            return;
        }

        // Check if pause is restricted to requester only
        if (bot.config.command.requesterOnly.includes('pause')) {
            const currentTrack = player.current;
            const userId = context.isMessage() ? context.getMessage().author.id : context.getInteraction().user.id;
            const isRequester = currentTrack?.requester?.id === userId;
            const isAdmin = bot.config.bot.admin.includes(userId);
            const member = context.isMessage()
                ? context.getMessage().member as GuildMember | null
                : context.getInteraction().member as GuildMember | null;
            const isDJ = PermissionManager.hasDJCommandPermission(bot, userId, member, player);
            const canDJBypass = bot.config.command.requesterDjBypass.includes('pause') && isDJ;
            if (!isRequester && !isAdmin && !canDJBypass) {
                await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PAUSE_NOT_REQUESTER'));
                return;
            }
        }

        const success = await player.pause();

        if (context.isMessage()) {
            await context.react(success ? '⏸️' : '❌');
        }
        else {
            if (success) {
                await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PAUSE_SUCCESS'));
            }
            else {
                await context.replyError(bot, client.i18n.t('commands:MESSAGE_PAUSE_FAIL'));
            }
        }
    }
}
