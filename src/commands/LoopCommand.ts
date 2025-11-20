import i18next from 'i18next';
import { RepeatMode } from 'lavashark';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class LoopCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'loop',
            aliases: ['lp'],
            description: i18next.t('commands:CONFIG_LOOP_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_LOOP_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'mode',
                    description: i18next.t('commands:CONFIG_LOOP_OPTION_DESCRIPTION'),
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: 'Off',
                            value: 'off'
                        },
                        {
                            name: 'One',
                            value: 'one'
                        },
                        {
                            name: 'All',
                            value: 'all'
                        }
                    ]
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);
        const metadata = this.getMetadata(bot);

        if (!player || !player.playing) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Get mode parameter
        const modeParam = context.isInteraction()
            ? context.getStringOption('mode')
            : context.args.join(' ');

        if (!modeParam) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_LOOP_COMMAND', {
                command: `${bot.config.bot.prefix}${metadata.usage}`
            }));
            return;
        }

        let mode: number | null = null;
        const methods = ['OFF', 'SINGLE', 'ALL'];

        switch (modeParam.toLowerCase()) {
            case 'off': {
                mode = 0;
                player.setRepeatMode(RepeatMode.OFF);
                break;
            }
            case 'one':
            case 'single': {
                mode = 1;
                player.setRepeatMode(RepeatMode.TRACK);
                break;
            }
            case 'all':
            case 'queue': {
                mode = 2;
                player.setRepeatMode(RepeatMode.QUEUE);
                break;
            }
            default: {
                await context.replyError(bot, client.i18n.t('commands:ERROR_LOOP_COMMAND', {
                    command: `${bot.config.bot.prefix}${metadata.usage}`
                }));
                return;
            }
        }

        if (context.isMessage()) {
            await context.react('👍');
        }

        await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_LOOP_MODE', {
            mode: methods[mode]
        }));
    }
}
