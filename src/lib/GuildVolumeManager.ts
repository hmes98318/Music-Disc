import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Bot } from '../@types/index.js';

export class GuildVolumeManager {
    private db: Database.Database | null = null;
    private bot: Bot;
    private dbPath: string;
    private guildVolumes: Map<string, number> = new Map();
    private defaultVolume: number;

    constructor(bot: Bot) {
        this.bot = bot;
        this.dbPath = './data/guild_volumes.db';
        this.defaultVolume = bot.config.bot.volume.default;
    }

    public initialize(): void {
        try {
            const dir = dirname(this.dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            this.db = new Database(this.dbPath);

            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guild_volumes (
                    guild_id TEXT PRIMARY KEY,
                    volume INTEGER NOT NULL
                )
            `);

            const rows = this.db.prepare('SELECT guild_id, volume FROM guild_volumes').all() as { guild_id: string, volume: number }[];
            for (const row of rows) {
                this.guildVolumes.set(row.guild_id, row.volume);
            }

            this.bot.logger.log(this.bot.shardId, `[GuildVolumeManager] Initialized with ${this.guildVolumes.size} guild-specific volume(s)`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[GuildVolumeManager] Failed to initialize: ${error}`);
        }
    }

    public get(guildId: string): number {
        return this.guildVolumes.get(guildId) ?? this.defaultVolume;
    }

    public set(guildId: string, volume: number): void {
        try {
            if (this.db) {
                this.db.prepare('INSERT OR REPLACE INTO guild_volumes (guild_id, volume) VALUES (?, ?)').run(guildId, volume);
            }
            this.guildVolumes.set(guildId, volume);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[GuildVolumeManager] Failed to set volume for guild ${guildId}: ${error}`);
        }
    }

    public close(): void {
        if (this.db) {
            this.db.close();
            this.bot.logger.log(this.bot.shardId, '[GuildVolumeManager] Database connection closed.');
        }
    }
}
