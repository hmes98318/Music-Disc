import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
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
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
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
