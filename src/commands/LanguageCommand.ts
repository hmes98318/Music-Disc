import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class LanguageCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'language',
            aliases: ['lang', 'locale'],
            description: i18next.t('commands:CONFIG_LANG_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_LANG_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: false,
            options: [
                {
                    name: 'locale',
                    description: i18next.t('commands:CONFIG_LANG_OPTION_DESCRIPTION'),
                    type: 3,
                    required: false
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const locale = context.isInteraction()
            ? context.getStringOption('locale')
            : context.args.join(' ');

        // Show available languages
        if (!locale) {
            await context.replyText(bot, client.i18n.t('commands:MESSAGE_LANG_AVAILABLE_LIST', {
                langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ')
            }));
            return;
        }

        // Validate language
        if (!bot.lang.languages.includes(locale)) {
            await context.replyError(bot, client.i18n.t('commands:MESSAGE_LANG_ARGS_ERROR', {
                langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ')
            }));
            return;
        }

        // Change language
        await client.i18n.changeLanguage(locale);

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_LANG_SUCCESS', { locale }));
        }
    }
}
