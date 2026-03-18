import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { PermissionManager } from '../lib/PermissionManager.js';
import { timeToSeconds } from '../utils/functions/unitConverter.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class SeekCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'seek',
            aliases: [],
            description: i18next.t('commands:CONFIG_SEEK_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_SEEK_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'seek',
                    description: i18next.t('commands:CONFIG_SEEK_OPTION_DESCRIPTION'),
                    type: 3,
                    required: true
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Check if seek is restricted to requester only
        if (bot.config.command.requesterOnly.includes('seek')) {
            const currentTrack = player.current;
            const userId = context.isMessage() ? context.getMessage().author.id : context.getInteraction().user.id;

            const isRequester = currentTrack?.requester?.id === userId;
            const isAdmin = bot.config.bot.admin.includes(userId);

            const member = context.isMessage()
                ? context.getMessage().member as GuildMember | null
                : context.getInteraction().member as GuildMember | null;
            const isDJ = PermissionManager.hasDJCommandPermission(bot, userId, member, player);
            const canDJBypass = bot.config.command.requesterDjBypass.includes('seek') && isDJ;

            if (!isRequester && !isAdmin && !canDJBypass) {
                await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_SEEK_NOT_REQUESTER'));
                return;
            }
        }

        // Get seek time parameter
        const str = context.isInteraction()
            ? context.getStringOption('seek')!
            : context.args.join(' ');

        const targetTime = timeToSeconds(str);

        if (!targetTime) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_SEEK_ARGS_ERROR'));
            return;
        }

        const targetTimeMs = targetTime * 1000;

        if (context.isMessage()) {
            await context.react('👍');
        }

        await player.seek(targetTimeMs);

        if (targetTimeMs >= player.current!.duration.value) {
            await context.replyWarning(bot, client.i18n.t('commands:MESSAGE_SEEK_SKIP', {
                duration: player.current!.duration.label
            }));
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_SEEK_SUCCESS', {
                duration: str
            }));
        }
    }
}
