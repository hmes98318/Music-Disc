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
            .map(g => `Guild ID: ${g.id}\\n Guild: ${g.name}\\n Members: ${g.memberCount}`)
            .join('\\n\\n');

        // Get DJ information
        const player = client.lavashark.getPlayer(context.guild!.id);
        const djInfo = await DJManager.getDJInfo(bot, client, context.guild!, player || undefined);
        
        // Format DJ role
        const djRoleText = bot.config.bot.djRoleId 
            ? `<@&${bot.config.bot.djRoleId}>` 
            : i18next.t('commands:MESSAGE_DJ_ROLE_NOT_SET');
        
        // Format admins
        const adminsText = djInfo.admins.length > 0 
            ? djInfo.admins.map(id => `<@${id}>`).join(', ')
            : 'None';
        
        // Format all DJs (static, role-based, and dynamic)
        const allDJs: string[] = [];
        
        // Add static DJs from config
        djInfo.staticDJs.forEach(id => {
            if (!djInfo.admins.includes(id)) {
                allDJs.push(`<@${id}> (Static)`);
            }
        });
        
        // Add role-based DJs
        djInfo.roleDJs.forEach(id => {
            allDJs.push(`<@${id}> (Role)`);
        });
        
        // Add dynamic DJs
        djInfo.dynamicDJs.forEach(id => {
            if (!djInfo.admins.includes(id) && !djInfo.staticDJs.includes(id)) {
                allDJs.push(`<@${id}> (Dynamic)`);
            }
        });
        
        const djUsersText = allDJs.length > 0 ? allDJs.join(', ') : 'None';

        await context.reply({
            embeds: [embeds.server(bot, serverlist, djRoleText, adminsText, djUsersText)],
            allowedMentions: { repliedUser: false }
        });
    }
}
