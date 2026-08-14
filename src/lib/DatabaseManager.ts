import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Bot } from '../@types/index.js';


type DatabaseTransaction<T extends unknown[]> = (db: Database.Database, ...args: T) => void;

export class DatabaseManager {
    private readonly bot: Bot;
    private readonly dbPath: string;
    private db: Database.Database | null = null;

    constructor(bot: Bot) {
        this.bot = bot;
        this.dbPath = bot.config.database.path;
    }

    public initialize(): void {
        try {
            const dir = dirname(this.dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            this.db = new Database(this.dbPath);
            this.configureConnection();
            this.initializeSchema();

            this.bot.logger.log(this.bot.shardId, `[DatabaseManager] Database initialized at ${this.dbPath}`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[DatabaseManager] Failed to initialize database: ${error}`);
            this.close();
        }
    }

    public getDatabase(): Database.Database | null {
        return this.db;
    }

    public executeTransaction<T extends unknown[]>(
        operation: DatabaseTransaction<T>,
        ...args: T
    ): void {
        if (!this.db) {
            return;
        }

        const db = this.db;
        const transaction = db.transaction((...transactionArgs: T) => {
            operation(db, ...transactionArgs);
        });
        transaction(...args);
    }

    public close(): void {
        if (!this.db) {
            return;
        }

        try {
            this.db.pragma('wal_checkpoint(TRUNCATE)');
        } catch (_) {}

        this.db.close();
        this.db = null;
        this.bot.logger.log(this.bot.shardId, '[DatabaseManager] Database connection closed.');
    }

    private configureConnection(): void {
        if (!this.db) {
            return;
        }

        this.db.pragma('journal_mode = WAL');   // Default is DELETE
        this.db.pragma('synchronous = NORMAL'); // Default is FULL
        this.db.pragma('temp_store = MEMORY');
        this.db.pragma('foreign_keys = ON');    // Default is OFF
        this.db.pragma('busy_timeout = 5000');  // Default is 0 (no timeout)
    }

    private initializeSchema(): void {
        if (!this.db) {
            return;
        }

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS queues (
                guild_id TEXT PRIMARY KEY,
                voice_channel_id TEXT NOT NULL,
                text_channel_id TEXT NOT NULL,
                tracks TEXT NOT NULL,
                current_track_index INTEGER NOT NULL,
                volume INTEGER NOT NULL,
                repeat_mode INTEGER NOT NULL,
                paused INTEGER NOT NULL,
                position INTEGER NOT NULL,
                timestamp INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS guild_volumes (
                guild_id TEXT PRIMARY KEY,
                volume INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS guild_languages (
                guild_id TEXT PRIMARY KEY,
                language TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blacklisted_users (
                user_id TEXT PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                is_m3u INTEGER DEFAULT 0,
                UNIQUE(guild_id, name)
            );

            CREATE TABLE IF NOT EXISTS playlist_tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                encoded TEXT,
                author TEXT,
                duration INTEGER,
                position INTEGER NOT NULL,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
            );
        `);

        const columns = this.db.prepare('PRAGMA table_info(playlists)').all() as Array<{ name: string }>;
        const hasIsM3u = columns.some((col) => col.name === 'is_m3u');

        if (!hasIsM3u) {
            this.db.exec('ALTER TABLE playlists ADD COLUMN is_m3u INTEGER DEFAULT 0;');
        }
    }
}
