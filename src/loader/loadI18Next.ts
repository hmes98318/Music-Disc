import { Language } from '../lib/i18n/Language.js';

import type { Client } from 'discord.js';
import type { Bot } from '../@types/index.js';


const loadControllerI18Next = async (bot: Bot) => {
    bot.lang = new Language(
        bot.logger,
        bot.config.bot.i18n.localePath,
        bot.config.bot.i18n.defaultLocale
    );

    bot.logger.emit('i18n', 'Initializing i18next...');
    bot.logger.emit('i18n', `Initializing default locales (${bot.config.bot.i18n.defaultLocale})...`);
    await bot.lang.initDefaultTemplate();

    bot.logger.emit('i18n', 'Loading language list...');
    await bot.lang.loadLangList();

    bot.i18n = await bot.lang.initI18Next();

    bot.logger.emit('i18n', 'i18next initialized successfully.');
    bot.logger.emit('i18n', `Loaded languages: ${bot.lang.languages.join(', ')}`);
};

const loadI18Next = async (bot: Bot, client: Client) => {
    bot.lang = new Language(
        bot.logger,
        bot.config.bot.i18n.localePath,
        bot.config.bot.i18n.defaultLocale
    );

    bot.logger.emit('i18n', 'Initializing i18next...');
    bot.logger.emit('i18n', `Initializing default locales (${bot.config.bot.i18n.defaultLocale})...`);
    await bot.lang.initDefaultTemplate();

    bot.logger.emit('i18n', 'Loading language list...');
    await bot.lang.loadLangList();

    bot.i18n = client.i18n = await bot.lang.initI18Next();

    bot.logger.emit('i18n', 'i18next initialized successfully.');
    bot.logger.emit('i18n', `Loaded languages: ${bot.lang.languages.join(', ')}`);
};

export { loadControllerI18Next, loadI18Next };