import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class DjCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'dj',
            aliases: ['adddj'],
            description: i18next.t('commands:CONFIG_DJ_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_DJ_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: false,
            options: [
                {
                    name: 'user',
                    description: i18next.t('commands:CONFIG_DJ_OPTION_DESCRIPTION'),
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const member = context.member as GuildMember;
        const player = client.lavashark.getPlayer(context.guild!.id);

        // Check permission
        if (!DJManager.isDJ(bot, context.user.id, member, player || undefined) &&
            !bot.config.bot.admin.includes(context.user.id)) {
            await context.replyError(bot, i18next.t('commands:MESSAGE_DJ_NO_PERMISSION'));
            return;
        }

        // Get target user
        let targetUser;
        if (context.isMessage()) {
            targetUser = context.getMessage().mentions.users.first();
            if (!targetUser) {
                await context.replyError(bot, i18next.t('commands:MESSAGE_DJ_MENTION_USER'));
                return;
            }
        }
        else {
            targetUser = context.getInteraction().options.getUser('user', true);
        }

        // Validate user
        if (targetUser.bot) {
            await context.replyError(bot, i18next.t('commands:MESSAGE_DJ_NO_BOTS'));
            return;
        }

        // Handle different DJ modes
        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            await context.replyWarning(bot, i18next.t('commands:MESSAGE_DJ_STATIC_MODE'));
            return;
        }
        // DYNAMIC mode - add to current player's DJ list
        else {
            if (!player) {
                await context.replyError(bot, i18next.t('commands:MESSAGE_DJ_NO_PLAYER'));
                return;
            }

            // Check if already DJ
            if (DJManager.isDJ(bot, targetUser.id, null, player)) {
                await context.replyWarning(bot, i18next.t('commands:MESSAGE_DJ_ALREADY_DJ', {
                    userId: targetUser.id
                }));
                return;
            }

            // Add DJ
            DJManager.addDJ(player, targetUser.id);
            await context.replySuccess(bot, i18next.t('commands:MESSAGE_DJ_SUCCESS', {
                userId: targetUser.id
            }));
        }
    }
}
