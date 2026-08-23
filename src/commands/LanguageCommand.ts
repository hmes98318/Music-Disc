import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { getLanguageDisplayName } from '../utils/languageUtils.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';

export class LanguageCommand extends BaseCommand {
    public getMetadata(bot: Bot, lng?: string): CommandMetadata {
        const choices = bot.lang.languages.slice(0, 25).map(lang => ({
            name: getLanguageDisplayName(lang),
            value: lang
        }));

        return {
            name: 'language',
            aliases: ['lang', 'locale'],
            description: i18next.t('commands:CONFIG_LANG_DESCRIPTION', { lng }),
            usage: i18next.t('commands:CONFIG_LANG_USAGE', { lng }),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: false,
            options: [
                {
                    name: 'language',
                    description: i18next.t('commands:CONFIG_LANG_OPTION_DESCRIPTION', { lng }),
                    type: 3,
                    required: false,
                    choices
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const locale = context.isInteraction()
            ? (context.getStringOption('language') || context.getStringOption('locale'))
            : context.args.join(' ');

        if (!locale) {
            const currentLocale = context.guildId
                ? (bot.guildLanguageManager?.get(context.guildId) || bot.config.bot.i18n.defaultLocale)
                : bot.config.bot.i18n.defaultLocale;

            const selectOptions = bot.lang.languages.map(lang => ({
                label: getLanguageDisplayName(lang),
                value: lang,
                default: lang === currentLocale
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_language')
                .setPlaceholder(bot.i18n.t('commands:CONFIG_LANG_OPTION_DESCRIPTION', { lng: currentLocale }))
                .addOptions(selectOptions);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await context.reply({
                embeds: [embeds.textMsg(bot, context.t('commands:MESSAGE_LANG_AVAILABLE_LIST', {
                    langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ')
                }))],
                components: [row]
            });
            return;
        }

        if (!bot.lang.languages.includes(locale)) {
            await context.replyEphemeralError(bot, context.t('commands:MESSAGE_LANG_ARGS_ERROR', {
                langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ')
            }));
            return;
        }

        if (context.guildId) {
            bot.guildLanguageManager?.set(context.guildId, locale);
        }

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, context.t('commands:MESSAGE_LANG_SUCCESS', { locale }));
        }
    }
}
