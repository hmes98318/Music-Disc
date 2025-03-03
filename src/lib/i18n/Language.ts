import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import i18next from 'i18next';
import I18NexFsBackend from "i18next-fs-backend";

import type { Logger } from '../Logger.js';


export class Language {
    public logger: Logger;
    public readonly localePath: string;

    public readonly namespaces: string[];
    public readonly languages: string[];

    #defaultLocale: string;
    #templateLocale: string;
    #defaultTemplate: Record<string, any>;


    constructor(logger: Logger, localePath: string = '../../locales', defaultLocale: string = 'en-US', templateLocale: string = 'en-US') {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        this.logger = logger;
        this.localePath = path.join(__dirname, localePath);

        this.namespaces = [];
        this.languages = [];

        this.#defaultLocale = defaultLocale;
        this.#templateLocale = templateLocale;
        this.#defaultTemplate = {};
    }


    /**
     * Initialize the default template using the en-US locale
     */
    public async initDefaultTemplate() {
        const templateLocalePath = path.join(this.localePath, this.#templateLocale);

        try {
            const files = await fs.promises.readdir(templateLocalePath, { withFileTypes: true });

            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.json')) {
                    const namespace = file.name.replace(/\.json$/, '');
                    this.namespaces.push(namespace);

                    const filePath = path.join(templateLocalePath, file.name);
                    const content = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
                    this.#defaultTemplate[namespace] = content;
                }
            }
        } catch (error) {
            throw Error(`Error loading default locale (${this.#templateLocale}) files from path "${templateLocalePath}": ` + JSON.stringify(error));
        }
    }

    /**
     * Load all languages and validate against the default template
     */
    public async loadLangList() {
        const localeDirs = await fs.promises.readdir(this.localePath, { withFileTypes: true });

        for (const localeDir of localeDirs) {
            if (!localeDir.isDirectory()) {
                if (localeDir.name !== 'README.md') {
                    this.logger.emit('i18n', `[warn] ${localeDir.name} is not a language directory`);
                }

                continue;
            }

            const language = localeDir.name;
            if (!/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
                this.logger.emit('i18n', `[error] Invalid language directory format: ${language}`);
                continue;
            }

            this.languages.push(language);

            const languagePath = path.join(this.localePath, language);
            const files = await fs.promises.readdir(languagePath, { withFileTypes: true });

            for (const file of files) {
                if (!file.isFile() || !file.name.endsWith('.json')) {
                    this.logger.emit('i18n', `[warn] wrong language file ${file.name}`);
                    continue;
                }

                const namespace = file.name.replace(/\.json$/, '');
                const filePath = path.join(languagePath, file.name);

                let content: Record<string, any> = {};
                try {
                    content = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
                } catch (error) {
                    console.error(`Error parsing JSON file: ${filePath}`, error);
                    continue;
                }

                // Validate and merge with default template
                const validatedContent = this.#validateAndMerge(language, namespace, content);
                await fs.promises.writeFile(filePath, JSON.stringify(validatedContent, null, 2), 'utf-8');
            }
        }
    }

    /**
     * Initialize i18next with loaded languages and namespaces
     */
    public async initI18Next() {
        i18next.use(I18NexFsBackend);
        await i18next.init({
            initAsync: true,
            backend: {
                loadPath: path.join(this.localePath, './{{lng}}/{{ns}}.json'),
            },
            debug: false,
            fallbackLng: this.#defaultLocale,
            initImmediate: false,
            interpolation: { escapeValue: false },
            load: 'all',
            ns: this.namespaces,
            preload: this.languages,
        });

        return i18next;
    }

    /**
     * Validate and merge a namespace file against the default template
     * @private
     * @param {string} language - Language name
     * @param {string} namespace - Namespace being validated
     * @param {Record<string, any>} content - Current content of the namespace
     * @returns {Record<string, any>} - Validated and completed content
     */
    #validateAndMerge(language: string, namespace: string, content: Record<string, any>): Record<string, any> {
        const template = this.#defaultTemplate[namespace] || {};

        for (const key in template) {
            if (!(key in content)) {
                this.logger.emit('i18n', `[warn] Local ${language} is missing the ${namespace}:${key} key, using default template key.`);
                content[key] = template[key];
            }
        }

        return content;
    }
}
