import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
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
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        if (player.paused) {
            await context.replyWarning(bot, client.i18n.t('commands:MESSAGE_PAUSE_MUSIC_PAUSED'));
            return;
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
