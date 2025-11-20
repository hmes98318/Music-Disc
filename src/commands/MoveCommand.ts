import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class MoveCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'move',
            aliases: ['mv', 'swap', 'change'],
            description: i18next.t('commands:CONFIG_MOVE_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_MOVE_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'moveindex1',
                    description: i18next.t('commands:CONFIG_MOVE_OPTION_DESCRIPTION'),
                    type: 4,
                    required: true,
                    min_value: 1
                },
                {
                    name: 'moveindex2',
                    description: i18next.t('commands:CONFIG_MOVE_OPTION_DESCRIPTION_2'),
                    type: 4,
                    required: true,
                    min_value: 1
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

        if (!player.queue.size) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_MUSIC_IN_QUEUE'));
            return;
        }

        let index1, index2: number;

        if (context.isInteraction()) {
            index1 = Math.floor(context.getInteraction().options.getInteger('moveindex1')!);
            index2 = Math.floor(context.getInteraction().options.getInteger('moveindex2')!);
        }
        else {
            index1 = parseInt(context.args[0], 10);
            index2 = parseInt(context.args[1], 10);

            if (isNaN(index1) || isNaN(index2)) {
                await context.replyError(bot, client.i18n.t('commands:MESSAGE_MOVE_WRONG_INDEX', {
                    max: player.queue.size
                }));
                return;
            }
        }

        const isSuccess = player.queue.move(index1 - 1, index2 - 1);

        if (!isSuccess) {
            await context.replyError(bot, client.i18n.t('commands:MESSAGE_MOVE_WRONG_INDEX', {
                max: player.queue.size
            }));
            return;
        }

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_MOVE_SUCCESS'));
        }
    }
}
