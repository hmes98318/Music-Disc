import { MessageFlags } from 'discord.js';
import { embeds } from '../../embeds/index.js';

import type { Client, StringSelectMenuInteraction } from 'discord.js';
import type { Bot } from '../../@types/index.js';

export class LanguageSelectHandler {
    public static async handle(
        bot: Bot,
        _client: Client,
        interaction: StringSelectMenuInteraction
    ): Promise<void> {
        if (interaction.customId !== 'select_language') return;

        const lng = bot.guildLanguageManager?.get(interaction.guildId!);

        if (bot.config.command.adminCommand.includes('language')) {
            if (!bot.config.bot.admin.includes(interaction.user.id)) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, bot.i18n.t('events:ERROR_REQUIRE_ADMIN', { lng }))],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        const selectedLocale = interaction.values[0];

        if (!bot.lang.languages.includes(selectedLocale)) {
            await interaction.reply({
                embeds: [embeds.textErrorMsg(bot, bot.i18n.t('commands:MESSAGE_LANG_ARGS_ERROR', {
                    lng,
                    langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ')
                }))],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (interaction.guildId) {
            bot.guildLanguageManager?.set(interaction.guildId, selectedLocale);
        }

        await interaction.reply({
            embeds: [embeds.textSuccessMsg(bot, bot.i18n.t('commands:MESSAGE_LANG_SUCCESS', {
                lng: selectedLocale,
                locale: selectedLocale
            }))],
            flags: MessageFlags.Ephemeral
        });
    }
}
