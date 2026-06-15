import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Bot } from '../@types/index.js';


/**
 * Manager for guild-specific language settings via SQLite
 */
export class GuildLanguageManager {
    private db: Database.Database | null = null;
    private bot: Bot;
    private dbPath: string;
    private guildLanguages: Map<string, string> = new Map();
    private defaultLocale: string;

    constructor(bot: Bot) {
        this.bot = bot;
        this.dbPath = './data/guild_languages.db';
        this.defaultLocale = bot.config.bot.i18n.defaultLocale;
    }

    /**
     * Initialize the SQLite database and populate in-memory Map
     */
    public initialize(): void {
        try {
            const dir = dirname(this.dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            this.db = new Database(this.dbPath);

            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guild_languages (
                    guild_id TEXT PRIMARY KEY,
                    language TEXT NOT NULL
                )
            `);

            // Populate in-memory Map
            const rows = this.db.prepare('SELECT guild_id, language FROM guild_languages').all() as { guild_id: string, language: string }[];
            for (const row of rows) {
                this.guildLanguages.set(row.guild_id, row.language);
            }

            this.bot.logger.log( this.bot.shardId, `[GuildLanguageManager] Initialized with ${this.guildLanguages.size} guild-specific language(s)`);
        } catch (error) {
            this.bot.logger.error( this.bot.shardId, `[GuildLanguageManager] Failed to initialize: ${error}`);
        }
    }

    /**
     * Get the language for a guild
     */
    public get(guildId: string): string {
        return this.guildLanguages.get(guildId) || this.defaultLocale;
    }

    /**
     * Set the language for a guild
     */
    public set(guildId: string, language: string): void {
        try {
            if (this.db) {
                this.db.prepare('INSERT OR REPLACE INTO guild_languages (guild_id, language) VALUES (?, ?)').run(guildId, language);
            }
            this.guildLanguages.set(guildId, language);
        } catch (error) {
            this.bot.logger.error( this.bot.shardId, `[GuildLanguageManager] Failed to set language for guild ${guildId}: ${error}`);
        }
    }

    /**
     * Close the database connection
     */
    public close(): void {
        if (this.db) {
            this.db.close();
            this.bot.logger.log( this.bot.shardId, '[GuildLanguageManager] Database connection closed.');
        }
    }
}
