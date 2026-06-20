import type { Bot, GuildVolumeTableRow } from '../@types/index.js';


export class GuildVolumeManager {
    private readonly bot: Bot;
    private readonly guildVolumes: Map<string, number> = new Map();
    private readonly defaultVolume: number;

    constructor(bot: Bot) {
        this.bot = bot;
        this.defaultVolume = bot.config.bot.volume.default;
    }

    public initialize(): void {
        try {
            const db = this.bot.databaseManager?.getDatabase();
            if (!db) {
                this.bot.logger.error(this.bot.shardId, '[GuildVolumeManager] Database is not initialized.');
                return;
            }

            const rows = db
                .prepare('SELECT guild_id, volume FROM guild_volumes')
                .all() as GuildVolumeTableRow[];
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
            if (!this.bot.databaseManager?.getDatabase()) {
                this.bot.logger.error(this.bot.shardId, '[GuildVolumeManager] Database is not initialized.');
                return;
            }

            this.bot.databaseManager.executeTransaction((db, id: string, value: number) => {
                db.prepare(
                    'INSERT OR REPLACE INTO guild_volumes (guild_id, volume) VALUES (?, ?)'
                ).run(id, value);
            }, guildId, volume);
            this.guildVolumes.set(guildId, volume);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[GuildVolumeManager] Failed to set volume for guild ${guildId}: ${error}`);
        }
    }

    public close(): void {
        this.guildVolumes.clear();
    }
}

