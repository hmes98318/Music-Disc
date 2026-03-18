import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
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
                    required: false
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        // Get target user
        let targetUser;
        if (context.isMessage()) {
            targetUser = context.getMessage().mentions.users.first();
        }
        else {
            targetUser = context.getInteraction().options.getUser('user', false);
        }

        // If no user provided, show DJ list
        if (!targetUser) {
            await this.showDJList(bot, client, context, player);
            return;
        }

        // Check permission for adding DJ - only admins can add/remove DJs
        if (!bot.config.bot.admin.includes(context.user.id)) {
            await context.replyEphemeralError(bot, i18next.t('commands:MESSAGE_DJ_ADMIN_ONLY'));
            return;
        }

        // Validate user
        if (targetUser.bot) {
            await context.replyEphemeralError(bot, i18next.t('commands:MESSAGE_DJ_NO_BOTS'));
            return;
        }

        // Handle different DJ modes
        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            await context.replyEphemeralError(bot, i18next.t('commands:MESSAGE_DJ_STATIC_MODE'));
            return;
        }
        // DYNAMIC mode - add to current player's DJ list
        else {
            if (!player) {
                await context.replyEphemeralError(bot, i18next.t('commands:MESSAGE_DJ_NO_PLAYER'));
                return;
            }

            // Check if already DJ
            if (DJManager.isDJ(bot, targetUser.id, null, player)) {
                await context.replyEphemeralError(bot, i18next.t('commands:MESSAGE_DJ_ALREADY_DJ', {
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

    private async showDJList(bot: Bot, client: Client, context: CommandContext, player: Player | null): Promise<void> {
        try {
            const djInfo = await DJManager.getDJInfo(bot, client, context.guild!, player || undefined);
            
            let description = i18next.t('commands:MESSAGE_DJ_LIST_TITLE') + '\n\n';
            
            // Add admins
            if (djInfo.admins.length > 0) {
                description += `**${i18next.t('commands:MESSAGE_DJ_LIST_ADMINS')}**\n`;
                description += djInfo.admins.map(id => `<@${id}>`).join(', ') + '\n\n';
            }
            
            // Add role-based DJs
            if (djInfo.roleDJs.length > 0) {
                description += `**${i18next.t('commands:MESSAGE_DJ_LIST_ROLE_DJS')}**\n`;
                description += djInfo.roleDJs.map(id => `<@${id}>`).join(', ') + '\n\n';
            }
            
            // Add dynamic DJs
            if (djInfo.dynamicDJs.length > 0) {
                description += `**${i18next.t('commands:MESSAGE_DJ_LIST_DYNAMIC_DJS')}**\n`;
                description += djInfo.dynamicDJs.map(id => `<@${id}>`).join(', ') + '\n\n';
            }
            
            // Add DJ role info
            if (bot.config.bot.djRoleId) {
                description += `**DJ Role:** <@&${bot.config.bot.djRoleId}>\n`;
            } else {
                description += i18next.t('commands:MESSAGE_DJ_ROLE_NOT_SET') + '\n';
            }
            
            if (djInfo.admins.length === 0 && djInfo.roleDJs.length === 0 && djInfo.dynamicDJs.length === 0) {
                description = i18next.t('commands:MESSAGE_DJ_LIST_NONE');
            }
            
            await context.replySuccess(bot, description);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `Error showing DJ list: ${error}`);
            await context.replyError(bot, i18next.t('commands:MESSAGE_DJ_LIST_ERROR'));
        }
    }
}
