import i18next from 'i18next';
import type { Client } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';

export class VolumeDefaultCommand extends BaseCommand {
    public getMetadata(bot: Bot): CommandMetadata {
        return {
            name: 'volume-default',
            aliases: ['vdef', 'voldef'],
            description: i18next.t('commands:CONFIG_VOLUME_DEFAULT_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_VOLUME_DEFAULT_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'volume',
                    description: bot.i18n.t('commands:CONFIG_VOLUME_DEFAULT_OPTION_DESCRIPTION', { maxVolume: bot.config.bot.volume.max }),
                    type: 4,
                    required: false,
                    min_value: 1,
                    max_value: bot.config.bot.volume.max
                }
            ]
        };
    }

    protected async run(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const maxVolume = bot.config.bot.volume.max;
        const volumeInput = context.isMessage()
            ? (context.args[0] ? parseInt(context.args[0], 10) : null)
            : context.getIntegerOption('volume');

        if (volumeInput === null) {
            const currentDefault = bot.guildVolumeManager?.get(context.guildId!) ?? bot.config.bot.volume.default;
            await context.replyEphemeralError(bot, context.t('commands:MESSAGE_VOLUME_DEFAULT_ARGS_ERROR', {
                volume: currentDefault,
                maxVolume
            }));
            return;
        }

        if (volumeInput < 0 || volumeInput > maxVolume) {
            await context.replyEphemeralError(bot, context.t('commands:MESSAGE_VOLUME_DEFAULT_ARGS_ERROR_2', { maxVolume }));
            return;
        }

        if (context.guildId) {
            bot.guildVolumeManager?.set(context.guildId, volumeInput);
        }

        if (context.isMessage()) {
            await context.react('👍');
        } else {
            await context.replySuccess(bot, context.t('commands:MESSAGE_VOLUME_DEFAULT_SUCCESS', {
                volume: volumeInput,
                maxVolume
            }));
        }
    }
}
