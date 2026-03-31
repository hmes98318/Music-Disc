import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Bot } from '../@types/index.js';


/**
 * Manager for dynamic blacklist persistence via SQLite
 */
export class BlacklistManager {
    private db: Database.Database | null = null;
    private bot: Bot;
    private dbPath: string;
    private blacklistedUsers: Set<string> = new Set();

    constructor(bot: Bot) {
        this.bot = bot;
        this.dbPath = './data/blacklist.db';
    }

    /**
     * Initialize the SQLite database and populate in-memory Set
     */
    public initialize(): void {
        try {
            const dir = dirname(this.dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            this.db = new Database(this.dbPath);

            this.db.exec(`
                CREATE TABLE IF NOT EXISTS blacklisted_users (
                    user_id TEXT PRIMARY KEY
                )
            `);

            // Populate in-memory Set
            const rows = this.db.prepare('SELECT user_id FROM blacklisted_users').all() as { user_id: string }[];
            for (const row of rows) {
                this.blacklistedUsers.add(row.user_id);
            }

            this.bot.logger.emit('log', this.bot.shardId, `[BlacklistManager] Initialized with ${this.blacklistedUsers.size} blacklisted user(s)`);
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, `[BlacklistManager] Failed to initialize: ${error}`);
        }
    }

    /**
     * Add a user to the dynamic blacklist
     * @returns false if already blacklisted
     */
    public add(userId: string): boolean {
        if (this.blacklistedUsers.has(userId)) {
            return false;
        }

        try {
            if (this.db) {
                this.db.prepare('INSERT OR IGNORE INTO blacklisted_users (user_id) VALUES (?)').run(userId);
            }
            this.blacklistedUsers.add(userId);
            return true;
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, `[BlacklistManager] Failed to add user ${userId}: ${error}`);
            return false;
        }
    }

    /**
     * Remove a user from the dynamic blacklist
     * @returns false if not in list
     */
    public remove(userId: string): boolean {
        if (!this.blacklistedUsers.has(userId)) {
            return false;
        }

        try {
            if (this.db) {
                this.db.prepare('DELETE FROM blacklisted_users WHERE user_id = ?').run(userId);
            }
            this.blacklistedUsers.delete(userId);
            return true;
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, `[BlacklistManager] Failed to remove user ${userId}: ${error}`);
            return false;
        }
    }

    /**
     * Get all dynamically blacklisted user IDs
     */
    public getAll(): string[] {
        return Array.from(this.blacklistedUsers);
    }

    /**
     * Check if a user is in the dynamic blacklist (in-memory)
     */
    public has(userId: string): boolean {
        return this.blacklistedUsers.has(userId);
    }

    /**
     * Close the database connection
     */
    public close(): void {
        if (this.db) {
            this.db.close();
            this.bot.logger.emit('log', this.bot.shardId, '[BlacklistManager] Database connection closed.');
        }
    }
}
