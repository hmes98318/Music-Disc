import type { BlacklistedUserTableRow, Bot } from '../@types/index.js';


export class BlacklistManager {
    private readonly bot: Bot;
    private readonly blacklistedUsers: Set<string> = new Set();

    constructor(bot: Bot) {
        this.bot = bot;
    }

    public initialize(): void {
        try {
            const db = this.bot.databaseManager?.getDatabase();
            if (!db) {
                this.bot.logger.error(this.bot.shardId, '[BlacklistManager] Database is not initialized.');
                return;
            }

            const rows = db
                .prepare('SELECT user_id FROM blacklisted_users')
                .all() as BlacklistedUserTableRow[];
            for (const row of rows) {
                this.blacklistedUsers.add(row.user_id);
            }

            this.bot.logger.log(
                this.bot.shardId,
                `[BlacklistManager] Initialized with ${this.blacklistedUsers.size} blacklisted user(s)`
            );
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[BlacklistManager] Failed to initialize: ${error}`);
        }
    }

    public add(userId: string): boolean {
        if (this.blacklistedUsers.has(userId)) {
            return false;
        }

        try {
            if (!this.bot.databaseManager?.getDatabase()) {
                this.bot.logger.error(this.bot.shardId, '[BlacklistManager] Database is not initialized.');
                return false;
            }

            this.bot.databaseManager.executeTransaction((db, id: string) => {
                db.prepare('INSERT OR IGNORE INTO blacklisted_users (user_id) VALUES (?)').run(id);
            }, userId);
            this.blacklistedUsers.add(userId);
            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[BlacklistManager] Failed to add user ${userId}: ${error}`);
            return false;
        }
    }

    public remove(userId: string): boolean {
        if (!this.blacklistedUsers.has(userId)) {
            return false;
        }

        try {
            if (!this.bot.databaseManager?.getDatabase()) {
                this.bot.logger.error(this.bot.shardId, '[BlacklistManager] Database is not initialized.');
                return false;
            }

            this.bot.databaseManager.executeTransaction((db, id: string) => {
                db.prepare('DELETE FROM blacklisted_users WHERE user_id = ?').run(id);
            }, userId);
            this.blacklistedUsers.delete(userId);
            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[BlacklistManager] Failed to remove user ${userId}: ${error}`);
            return false;
        }
    }

    public getAll(): string[] {
        return Array.from(this.blacklistedUsers);
    }

    public has(userId: string): boolean {
        return this.blacklistedUsers.has(userId);
    }

    public close(): void {
        this.blacklistedUsers.clear();
    }
}
