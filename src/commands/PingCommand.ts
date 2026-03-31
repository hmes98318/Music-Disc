import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


/**
 * Ping command - Shows bot latency
 */
export class PingCommand extends BaseCommand {
    getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'ping',
            aliases: [],
            description: i18next.t('commands:CONFIG_PING_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_PING_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const botPing = `${Date.now() - context.createdTimestamp}ms`;
        const apiPing = client.ws.ping.toString();

        await context.react('👍');

        await context.reply({
            embeds: [embeds.ping(bot, botPing, apiPing)]
        });
    }
}
