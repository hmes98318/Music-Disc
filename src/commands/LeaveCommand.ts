import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class LeaveCommand extends BaseCommand {
    public getMetadata(_bot: Bot, lng?: string): CommandMetadata {
        return {
            name: 'leave',
            aliases: [],
            description: i18next.t('commands:CONFIG_LEAVE_DESCRIPTION', { lng }),
            usage: i18next.t('commands:CONFIG_LEAVE_USAGE', { lng }),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        if (bot.config.queuePersistence.enabled && client.queuePersistence) {
            client.queuePersistence.stopPeriodicSave(player.guildId);
            client.queuePersistence.deleteQueue(player.guildId);
        }

        player.destroy();

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, context.t('commands:MESSAGE_LEAVE_SUCCESS'));
        }
    }
}
