import { PermissionFlagsBits } from 'discord.js';
import { DJManager } from './DjManager.js';
import { DJModeEnum, AdminModeEnum } from '../@types/index.js';

import type { GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';

/**
 * Permission utilities for checking user permissions
 */
export class PermissionManager {
    /**
     * Check if a user is an admin.
     * Supports 'STATIC' (config.js based) or 'DYNAMIC' (Discord Administrator / Manage Guild permissions) based on adminMode.
     */
    public static isAdmin(bot: Bot, userId: string, member?: GuildMember | null): boolean {
        // Explicit admin list in config.js always applies
        if (bot.config.bot.admin.includes(userId)) {
            return true;
        }

        // In DYNAMIC mode, check server Administrator or ManageGuild permissions
        if (bot.config.bot.adminMode === AdminModeEnum.DYNAMIC && member && member.permissions) {
            return member.permissions.has(PermissionFlagsBits.Administrator) ||
                   member.permissions.has(PermissionFlagsBits.ManageGuild);
        }

        return false;
    }


    /**
     * Check if user has DJ command permission using the new DJ system
     */
    public static hasDJCommandPermission(bot: Bot, userId: string, member: GuildMember | null, player?: Player): boolean {
        if (this.isAdmin(bot, userId, member)) {
            return true;
        }

        return DJManager.isDJ(bot, userId, member, player);
    }

    /**
     * Legacy DJ permission check for backward compatibility
     */
    public static legacyDJCheck(bot: Bot, userId: string, member: GuildMember | null, player?: Player): boolean {
        if (this.isAdmin(bot, userId, member)) {
            return true;
        }

        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            const hasDJRole = member && bot.config.bot.djRoleId && member.roles.cache.has(bot.config.bot.djRoleId);
            return bot.config.bot.dj.includes(userId) || !!hasDJRole;
        } else {
            return DJManager.isDJ(bot, userId, member, player);
        }
    }
}

