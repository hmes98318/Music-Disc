import i18next from 'i18next';

import type { BaseCommand } from '../commands/base/BaseCommand.js';
import type { Bot } from '../@types/index.js';

const SPECIAL_DISCORD_LOCALES: Record<string, string> = {
    'sr-RS': 'sr-CS',
};

const FULL_TAG_DISCORD_LOCALES = new Set([
    'en-US', 'en-GB', 'zh-TW', 'zh-CN', 'es-ES', 'pt-BR', 'sv-SE'
]);

/**
 * Converts i18n locale code (e.g. ko-KR, ru-RU, ja-JP) to Discord compatible locale string
 */
function toDiscordLocale(i18nLocale: string): string {
    if (SPECIAL_DISCORD_LOCALES[i18nLocale]) {
        return SPECIAL_DISCORD_LOCALES[i18nLocale];
    }
    if (FULL_TAG_DISCORD_LOCALES.has(i18nLocale)) {
        return i18nLocale;
    }
    return i18nLocale.split('-')[0];
}

/**
 * Builds localized Discord slash command payload using i18next resources automatically
 */
export function buildSlashCommandsWithLocalizations(commands: BaseCommand[], bot: Bot) {
    const resourceStore = (i18next.services as any)?.resourceStore?.data || (i18next as any).store?.data || {};
    const loadedLocales = Object.keys(resourceStore);
    const i18nLocales = loadedLocales.length > 0 ? loadedLocales : (i18next.languages || ['en-US', 'ko-KR']);

    const localeMap: Record<string, string> = {};
    for (const locale of i18nLocales) {
        localeMap[locale] = toDiscordLocale(locale);
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
            return {
                ...opt,
                descriptionLocalizations: optDescLocalizations,
                description_localizations: optDescLocalizations
            };
        });

        return {
            name: metadata.name,
            description: metadata.description,
            descriptionLocalizations,
            description_localizations: descriptionLocalizations,
            options
        };
    });
}
