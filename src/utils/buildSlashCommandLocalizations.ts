import i18next from 'i18next';
import type { ApplicationCommandDataResolvable } from 'discord.js';

import type { BaseCommand } from '../commands/base/BaseCommand.js';
import type { Bot } from '../@types/index.js';

const VALID_DISCORD_LOCALES = new Set([
    'ar', 'bg', 'cs', 'da', 'de', 'el', 'en-GB', 'en-US', 'es-ES', 'es-419',
    'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'nl',
    'no', 'pl', 'pt-BR', 'ro', 'ru', 'sv-SE', 'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]);

const SPECIAL_DISCORD_LOCALES: Record<string, string> = {
    'sr-RS': 'sr',
};

const FULL_TAG_DISCORD_LOCALES = new Set([
    'en-US', 'en-GB', 'zh-TW', 'zh-CN', 'es-ES', 'pt-BR', 'sv-SE'
]);

/**
 * Converts i18n locale code (e.g. ko-KR, ru-RU, ja-JP) to Discord compatible locale string
 */
function toDiscordLocale(i18nLocale: string): string | null {
    let targetLocale: string;
    if (SPECIAL_DISCORD_LOCALES[i18nLocale]) {
        targetLocale = SPECIAL_DISCORD_LOCALES[i18nLocale];
    } else if (FULL_TAG_DISCORD_LOCALES.has(i18nLocale)) {
        targetLocale = i18nLocale;
    } else {
        targetLocale = i18nLocale.split('-')[0];
    }

    return VALID_DISCORD_LOCALES.has(targetLocale) ? targetLocale : null;
}

/**
 * Builds clean localized Discord slash command payload using i18next resources automatically
 */
export function buildSlashCommandsWithLocalizations(commands: BaseCommand[], bot: Bot): ApplicationCommandDataResolvable[] {
    const resourceStore = (i18next.services as any)?.resourceStore?.data || (i18next as any).store?.data || {};
    const loadedLocales = Object.keys(resourceStore);
    const i18nLocales = loadedLocales.length > 0 ? loadedLocales : (i18next.languages || ['en-US', 'ko-KR']);

    const localeMap: Record<string, string> = {};
    for (const locale of i18nLocales) {
        const discordLocale = toDiscordLocale(locale);
        if (discordLocale) {
            localeMap[locale] = discordLocale;
        }
    }

    const textToKeyMap = new Map<string, string>();
    for (const locale of i18nLocales) {
        const bundle = i18next.getResourceBundle(locale, 'commands') || {};
        for (const [key, value] of Object.entries(bundle)) {
            if (typeof value === 'string') {
                textToKeyMap.set(value, key);
            }
        }
    }

    const getLocalizations = (text: string): Record<string, string> | undefined => {
        if (!text) return undefined;
        const key = textToKeyMap.get(text);
        if (!key) return undefined;

        const localizations: Record<string, string> = {};
        for (const [i18nLocale, discordLocale] of Object.entries(localeMap)) {
            const localizedValue: string = i18next.t(`commands:${key}`, { lng: i18nLocale }) as unknown as string;
            if (localizedValue && localizedValue !== key) {
                localizations[discordLocale] = localizedValue;
            }
        }
        return Object.keys(localizations).length > 0 ? localizations : undefined;
    };

    return commands.map(cmd => {
        const metadata = cmd.getMetadata(bot);
        const descriptionLocalizations = getLocalizations(metadata.description);

        const options = metadata.options?.map((opt: any) => {
            const optDescLocalizations = opt.description ? getLocalizations(opt.description) : undefined;
            const cleanedOpt: Record<string, any> = {
                name: opt.name,
                description: opt.description,
                type: opt.type,
            };

            if (opt.required !== undefined) cleanedOpt.required = opt.required;
            if (opt.choices) cleanedOpt.choices = opt.choices;
            if (opt.autocomplete !== undefined) cleanedOpt.autocomplete = opt.autocomplete;
            if (opt.options) cleanedOpt.options = opt.options;
            if (opt.channelTypes || opt.channel_types) cleanedOpt.channelTypes = opt.channelTypes || opt.channel_types;
            if (opt.minValue !== undefined || opt.min_value !== undefined) cleanedOpt.minValue = opt.minValue ?? opt.min_value;
            if (opt.maxValue !== undefined || opt.max_value !== undefined) cleanedOpt.maxValue = opt.maxValue ?? opt.max_value;
            if (opt.minLength !== undefined || opt.min_length !== undefined) cleanedOpt.minLength = opt.minLength ?? opt.min_length;
            if (opt.maxLength !== undefined || opt.max_length !== undefined) cleanedOpt.maxLength = opt.maxLength ?? opt.max_length;

            if (optDescLocalizations) {
                cleanedOpt.descriptionLocalizations = optDescLocalizations;
            }

            return cleanedOpt;
        });

        const cleanedCommand: Record<string, any> = {
            name: metadata.name,
            description: metadata.description,
        };

        if (descriptionLocalizations) {
            cleanedCommand.descriptionLocalizations = descriptionLocalizations;
        }

        if (options && options.length > 0) {
            cleanedCommand.options = options;
        }

        return cleanedCommand as ApplicationCommandDataResolvable;
    });
}
