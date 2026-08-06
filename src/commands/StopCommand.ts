import i18next from 'i18next';
import { RepeatMode } from 'lavashark';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class StopCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'stop',
            aliases: [],
            description: i18next.t('commands:CONFIG_STOP_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_STOP_USAGE'),
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
            await context.replyEphemeralError(bot, context.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Clean up queue persistence before stopping
        if (bot.config.queuePersistence.enabled && client.queuePersistence) {
            client.queuePersistence.stopPeriodicSave(player.guildId);
            client.queuePersistence.deleteQueue(player.guildId);
        }

        // Turn off repeat mode before clearing queue to prevent track re-playback on skip
        if (player.repeatMode !== RepeatMode.OFF) {
            player.setRepeatMode(RepeatMode.OFF);
        }

        player.queue.clear();
        await player.skip();
        await client.dashboard.destroy(player);


        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, context.t('commands:MESSAGE_STOP_SUCCESS'));
        }
    }
}

