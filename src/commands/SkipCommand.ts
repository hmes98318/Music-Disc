import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { PermissionManager } from '../lib/PermissionManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


/**
 * Skip command - Skips current track
 */
export class SkipCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'skip',
            aliases: ['s'],
            description: i18next.t('commands:CONFIG_SKIP_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_SKIP_USAGE'),
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

        // Check if skip is restricted to requester only
        if (bot.config.command.requesterOnly.includes('skip')) {
            const currentTrack = player.current;
            const userId = context.isMessage() ? context.getMessage().author.id : context.getInteraction().user.id;

            // Check if user is the requester
            const isRequester = currentTrack?.requester?.id === userId;

            // Check if user is admin (admins can always skip)
            const isAdmin = bot.config.bot.admin.includes(userId);

            // Check if user is DJ and DJ bypass is enabled for skip
            const member = context.isMessage()
                ? context.getMessage().member as GuildMember | null
                : context.getInteraction().member as GuildMember | null;
            const isDJ = PermissionManager.hasDJCommandPermission(bot, userId, member, player);
            const canDJBypass = bot.config.command.requesterDjBypass.includes('skip') && isDJ;

            // Deny skip if user is not requester and doesn't have bypass permissions
            if (!isRequester && !isAdmin && !canDJBypass) {
                await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_SKIP_NOT_REQUESTER'));
                return;
            }
        }

        const success = await player.skip();

        if (context.isMessage()) {
            await context.react(success ? '👍' : '❌');
        }
        else {
            if (success) {
                await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_SKIP_SUCCESS'));
            }
            else {
                await context.replyError(bot, client.i18n.t('commands:MESSAGE_SKIP_FAIL'));
            }
        }
    }
}
