import { DJManager } from './DjManager.js';
import { DJModeEnum } from '../@types/index.js';

import type { GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';

/**
 * Permission utilities for checking user permissions
 */
export class PermissionManager {
    /**
     * Check if user has DJ command permission using the new DJ system
     */
    public static hasDJCommandPermission(bot: Bot, userId: string, member: GuildMember | null, player?: Player): boolean {
        // Admin always has permission
        if (bot.config.bot.admin.includes(userId)) {
            return true;
        }

        // Use DJManager to check DJ permissions
        return DJManager.isDJ(bot, userId, member, player);
    }

    /**
     * Legacy DJ permission check for backward compatibility
     * This function keeps the old logic but integrates with the new DJ system
     */
    public static legacyDJCheck(bot: Bot, userId: string, member: GuildMember | null, player?: Player): boolean {
        // Admin always has permission
        if (bot.config.bot.admin.includes(userId)) {
            return true;
        }

        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            // Static mode: use old logic
            const hasDJRole = member && bot.config.bot.djRoleId && member.roles.cache.has(bot.config.bot.djRoleId);
            return bot.config.bot.dj.includes(userId) || !!hasDJRole;
        } else {
            // Dynamic mode: use new logic
            return DJManager.isDJ(bot, userId, member, player);
        }
    }
}
