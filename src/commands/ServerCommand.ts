import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class ServerCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'server',
            aliases: [],
            description: i18next.t('commands:CONFIG_SERVER_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_SERVER_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const serverlist = client.guilds.cache
            .map(g => `${bot.i18n.t('commands:MESSAGE_SERVER_GUILD_ID')}: ${g.id}\n ${bot.i18n.t('commands:MESSAGE_SERVER_GUILD')}: ${g.name}\n ${bot.i18n.t('commands:MESSAGE_SERVER_MEMBERS')}: ${g.memberCount}`)
            .join('\n\n');

        // Get DJ information
        const player = client.lavashark.getPlayer(context.guild!.id);
        const djInfo = await DJManager.getDJInfo(bot, client, context.guild!, player || undefined);
        
        // Format DJ role
        const djRoleText = bot.config.bot.djRoleId 
            ? `<@&${bot.config.bot.djRoleId}>` 
            : bot.i18n.t('commands:MESSAGE_DJ_ROLE_NOT_SET');
        
        // Format admins
        const adminsText = djInfo.admins.length > 0 
            ? djInfo.admins.map(id => `<@${id}>`).join(', ')
            : bot.i18n.t('commands:MESSAGE_NONE');
        
        // Format all DJs (static, role-based, and dynamic)
        const allDJs: string[] = [];
        
        // Add static DJs from config
        djInfo.staticDJs.forEach(id => {
            if (!djInfo.admins.includes(id)) {
                allDJs.push(`<@${id}> ${bot.i18n.t('commands:MESSAGE_DJ_TYPE_STATIC')}`);
            }
        });
        
        // Add role-based DJs
        djInfo.roleDJs.forEach(id => {
            allDJs.push(`<@${id}> ${bot.i18n.t('commands:MESSAGE_DJ_TYPE_ROLE')}`);
        });
        
        // Add dynamic DJs
        djInfo.dynamicDJs.forEach(id => {
            if (!djInfo.admins.includes(id) && !djInfo.staticDJs.includes(id)) {
                allDJs.push(`<@${id}> ${bot.i18n.t('commands:MESSAGE_DJ_TYPE_DYNAMIC')}`);
            }
        });
        
        const djUsersText = allDJs.length > 0 ? allDJs.join(', ') : bot.i18n.t('commands:MESSAGE_NONE');

        await context.reply({
            embeds: [embeds.server(bot, serverlist, djRoleText, adminsText, djUsersText)],
            allowedMentions: { repliedUser: false }
        });
    }
}
