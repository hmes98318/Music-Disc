import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

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
            .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
            .join('\n\n');

        await context.reply({
            embeds: [embeds.server(bot, serverlist)],
            allowedMentions: { repliedUser: false }
        });
    }
}
