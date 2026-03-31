import i18next from 'i18next';
import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class ClearCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'clear',
            aliases: ['cls'],
            description: i18next.t('commands:CONFIG_CLEAR_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_CLEAR_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        player.queue.clear();

        // Update persisted queue to reflect cleared queue (current track still playing)
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            await (client as any).queuePersistence.saveQueue(player);
        }

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_CLEAR_SUCCESS'));
        }
    }
}
