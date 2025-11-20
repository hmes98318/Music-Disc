import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { timeToSeconds } from '../utils/functions/unitConverter.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class SeekCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'seek',
            aliases: [],
            description: i18next.t('commands:CONFIG_SEEK_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_SEEK_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'seek',
                    description: i18next.t('commands:CONFIG_SEEK_OPTION_DESCRIPTION'),
                    type: 3,
                    required: true
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Get seek time parameter
        const str = context.isInteraction()
            ? context.getStringOption('seek')!
            : context.args.join(' ');

        const targetTime = timeToSeconds(str);

        if (!targetTime) {
            await context.replyError(bot, client.i18n.t('commands:MESSAGE_SEEK_ARGS_ERROR'));
            return;
        }

        const targetTimeMs = targetTime * 1000;

        if (context.isMessage()) {
            await context.react('👍');
        }

        await player.seek(targetTimeMs);

        if (targetTimeMs >= player.current!.duration.value) {
            await context.replyWarning(bot, client.i18n.t('commands:MESSAGE_SEEK_SKIP', {
                duration: player.current!.duration.label
            }));
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_SEEK_SUCCESS', {
                duration: str
            }));
        }
    }
}
