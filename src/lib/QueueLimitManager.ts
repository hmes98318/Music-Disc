import { PermissionFlagsBits } from 'discord.js';
import { DJManager } from './DjManager.js';

import type { GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';

/**
 * Manager for handling queue limit checks per user
 */
export class QueueLimitManager {
    /**
     * Get the maximum number of songs a user can have in the queue
     * @param bot - Bot instance
     * @param userId - User ID to check
     * @param member - Guild member object
     * @param player - Optional player instance for DJ checks
     * @returns The maximum number of songs allowed for this user
     */
    public static getUserLimit(bot: Bot, userId: string, member: GuildMember | null, player?: Player): number {
        const config = bot.config.maxQueuedSongs;

        // If feature is disabled, return unlimited (Infinity)
        if (!config.enabled) {
            return Infinity;
        }

        // Admins always bypass (unlimited)
        if (member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return Infinity;
        }

        // Check if user is admin in bot config
        if (bot.config.bot.admin.includes(userId)) {
            return Infinity;
        }

        let maxLimit = config.default;

        // Check custom role limits (use highest limit if user has multiple roles)
        if (member && Object.keys(config.roles).length > 0) {
            const userRoles = member.roles.cache.map(r => r.id);
            
            for (const roleId of userRoles) {
                if (config.roles[roleId] !== undefined) {
                    const roleLimit = config.roles[roleId];
                    if (roleLimit > maxLimit) {
                        maxLimit = roleLimit;
                    }
                }
            }
            
            // If user had a custom role limit, return it (don't check DJ)
            if (maxLimit !== config.default) {
                return maxLimit;
            }
        }

        // Check if user is DJ (use DJ limit)
        if (DJManager.isDJ(bot, userId, member, player)) {
            return config.djs;
        }

        // Return default limit
        return maxLimit;
    }

    /**
     * Count how many songs a user currently has in the queue
     * @param player - Player instance
     * @param userId - User ID to count songs for
     * @returns Number of songs the user has in the queue
     */
    public static countUserSongsInQueue(player: Player, userId: string): number {
        let count = 0;

        // Count songs in the queue
        if (player.queue && player.queue.tracks) {
            count = player.queue.tracks.filter(track => track.requester?.id === userId).length;
        }

        // Check if current track is also from this user
        if (player.current?.requester?.id === userId) {
            count++;
        }

        return count;
    }

    /**
     * Check if user can add more songs to the queue
     * @param bot - Bot instance
     * @param player - Player instance
     * @param userId - User ID to check
     * @param member - Guild member object
     * @param songsToAdd - Number of songs user wants to add (default: 1)
     * @returns Object with canAdd boolean and details
     */
    public static canAddSongs(
        bot: Bot,
        player: Player,
        userId: string,
        member: GuildMember | null,
        songsToAdd: number = 1
    ): { canAdd: boolean; currentCount: number; limit: number; availableSlots: number } {
        const limit = this.getUserLimit(bot, userId, member, player);
        const currentCount = this.countUserSongsInQueue(player, userId);
        const availableSlots = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);
        const canAdd = limit === Infinity || (currentCount + songsToAdd) <= limit;

        return {
            canAdd,
            currentCount,
            limit,
            availableSlots
        };
    }

    /**
     * Calculate how many songs from a playlist can be added
     * @param bot - Bot instance
     * @param player - Player instance
     * @param userId - User ID
     * @param member - Guild member object
     * @param playlistSize - Total number of songs in the playlist
     * @returns Object with number of songs that can be added and how many will be skipped
     */
    public static calculatePlaylistAddition(
        bot: Bot,
        player: Player,
        userId: string,
        member: GuildMember | null,
        playlistSize: number
    ): { canAddCount: number; willSkipCount: number; limitReached: boolean } {
        const { limit, availableSlots } = this.canAddSongs(bot, player, userId, member, 0);

        if (limit === Infinity) {
            return {
                canAddCount: playlistSize,
                willSkipCount: 0,
                limitReached: false
            };
        }

        const canAddCount = Math.min(playlistSize, availableSlots);
        const willSkipCount = Math.max(0, playlistSize - canAddCount);
        const limitReached = availableSlots <= 0;

        return {
            canAddCount,
            willSkipCount,
            limitReached
        };
    }
}
