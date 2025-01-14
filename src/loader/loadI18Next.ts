import { Language } from '../lib/i18n/Language.js';

import type { Client } from 'discord.js';
import type { Bot } from '../@types/index.js';


const loadI18Next = async (bot: Bot, client: Client) => {
    const lang = new Language(
        bot.logger,
        bot.config.bot.i18n.localePath,
        bot.config.bot.i18n.defaultLocale
    );

    bot.logger.emit('i18n', 'Initializing i18next...');
    bot.logger.emit('i18n', `Initializing default locales (${bot.config.bot.i18n.defaultLocale})...`);
    await lang.initDefaultTemplate();

    bot.logger.emit('i18n', 'Loading language list...');
    await lang.loadLangList();

    bot.i18n = client.i18n = await lang.initI18Next();

    bot.logger.emit('i18n', 'i18next initialized successfully.');
    bot.logger.emit('i18n', `Loaded languages: ${lang.languages.join(', ')}`);
};

export { loadI18Next };