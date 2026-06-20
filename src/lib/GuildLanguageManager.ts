import type { Bot, GuildLanguageTableRow } from '../@types/index.js';


export class GuildLanguageManager {
    private readonly bot: Bot;
    private readonly guildLanguages: Map<string, string> = new Map();
    private readonly defaultLocale: string;

    constructor(bot: Bot) {
        this.bot = bot;
        this.defaultLocale = bot.config.bot.i18n.defaultLocale;
    }

    public initialize(): void {
        try {
            const db = this.bot.databaseManager?.getDatabase();
            if (!db) {
                this.bot.logger.error(this.bot.shardId, '[GuildLanguageManager] Database is not initialized.');
                return;
            }

            const rows = db
                .prepare('SELECT guild_id, language FROM guild_languages')
                .all() as GuildLanguageTableRow[];
            for (const row of rows) {
                this.guildLanguages.set(row.guild_id, row.language);
            }

            this.bot.logger.log(this.bot.shardId, `[GuildLanguageManager] Initialized with ${this.guildLanguages.size} guild-specific language(s)`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[GuildLanguageManager] Failed to initialize: ${error}`);
        }
    }

    public get(guildId: string): string {
        return this.guildLanguages.get(guildId) ?? this.defaultLocale;
    }

    public set(guildId: string, language: string): void {
        try {
            if (!this.bot.databaseManager?.getDatabase()) {
                this.bot.logger.error(this.bot.shardId, '[GuildLanguageManager] Database is not initialized.');
                return;
            }

            this.bot.databaseManager.executeTransaction((db, id: string, locale: string) => {
                db.prepare(
                    'INSERT OR REPLACE INTO guild_languages (guild_id, language) VALUES (?, ?)'
                ).run(id, locale);
            }, guildId, language);
            this.guildLanguages.set(guildId, language);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[GuildLanguageManager] Failed to set language for guild ${guildId}: ${error}`);
        }
    }

    public close(): void {
        this.guildLanguages.clear();
    }
}

