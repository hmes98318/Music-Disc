import { DJModeEnum } from '../@types/index.js';

import type { VoiceBasedChannel, GuildMember, Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';


/**
 * DJ Management utilities for both static and dynamic DJ modes
 */
export class DJManager {
    /**
     * Check if any member with the DJ role is in the voice channel (excluding bots)
     */
    public static hasDJRoleInChannel(bot: Bot, voiceChannel: VoiceBasedChannel): boolean {
        if (!bot.config.bot.djRoleId) return false;
        return voiceChannel.members.some(m => !m.user.bot && m.roles.cache.has(bot.config.bot.djRoleId!));
    }

    /**
     * Check if a user has DJ permissions
     */
    public static isDJ(bot: Bot, userId: string, member: GuildMember | null, player?: Player): boolean {
        // Admin always has DJ permissions
        if (bot.config.bot.admin.includes(userId)) {
            return true;
        }

        // Static mode: Check config DJ list and role
        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            const hasDJRole = member && bot.config.bot.djRoleId && member.roles.cache.has(bot.config.bot.djRoleId);
            return bot.config.bot.dj.includes(userId) || !!hasDJRole;
        }
        // Dynamic mode: Check if user is in player's DJ list
        else {
            if (player && player.djUsers && player.djUsers.has(userId)) {
                return true;
            }

            // Also check static DJ list and role as fallback (for manually added DJs)
            const hasDJRole = member && bot.config.bot.djRoleId && member.roles.cache.has(bot.config.bot.djRoleId);
            return bot.config.bot.dj.includes(userId) || !!hasDJRole;
        }
    }

    /**
     * Add a user as DJ in dynamic mode.
     * Only 1 dynamic DJ at a time — clear existing before adding.
     */
    public static addDJ(player: Player, userId: string): void {
        // Cancel any pending DJ leave timeout when a new DJ is assigned
        this.cancelDJLeaveTimeout(player);

        if (!player.djUsers) {
            player.djUsers = new Set();
        }

        player.djUsers.clear();
        player.djUsers.add(userId);
    }

    /**
     * Remove a user from DJ in dynamic mode
     */
    public static removeDJ(player: Player, userId: string): void {
        if (player.djUsers) {
            player.djUsers.delete(userId);
        }
    }

    /**
     * Check if any DJ is set in dynamic mode
     */
    public static hasDJSet(player: Player): boolean {
        return !!(player.djUsers && player.djUsers.size > 0);
    }

    /**
     * Get all DJ users for the current guild
     */
    public static getDJUsers(bot: Bot, player?: Player): string[] {
        if (bot.config.bot.djMode === DJModeEnum.STATIC) {
            return bot.config.bot.dj;
        }
        // DYNAMIC mode
        else {
            if (player && player.djUsers) {
                return Array.from(player.djUsers);
            }

            return [];
        }
    }

    /**
     * Get DJ information categorized by type
     * Each user appears in only one category using priority: Admin > Role > Dynamic/Static
     */
    public static async getDJInfo(bot: Bot, client: Client, guild: any, player?: Player): Promise<{
        admins: string[];
        roleDJs: string[];
        dynamicDJs: string[];
        staticDJs: string[];
    }> {
        // Deduplicate admins array itself
        const admins = [...new Set(bot.config.bot.admin)];
        const staticDJs = bot.config.bot.dj;
        const seen = new Set<string>(admins);

        // Get role-based DJs, excluding anyone already counted as admin
        const roleDJs: string[] = [];
        if (bot.config.bot.djRoleId && guild) {
            try {
                const djRole = guild.roles.cache.get(bot.config.bot.djRoleId);
                if (djRole) {
                    djRole.members.forEach((member: any) => {
                        if (!seen.has(member.user.id)) {
                            roleDJs.push(member.user.id);
                            seen.add(member.user.id);
                        }
                    });
                }
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error fetching guild members for DJ role check: ' + error);
            }
        }

        // Dynamic DJs, excluding anyone already counted as admin or role DJ
        const rawDynamicDJs = (player && player.djUsers) ? Array.from(player.djUsers) : [];
        const dynamicDJs = rawDynamicDJs.filter(id => !seen.has(id));

        return { admins, roleDJs, dynamicDJs, staticDJs };
    }

    /**
     * Get formatted DJ display string with type indicators.
     * In DYNAMIC mode (used for dashboard subtitle), only shows dynamic DJ users.
     * In STATIC mode, shows admins, role DJs, and static DJs with deduplication.
     */
    public static async getDJDisplayString(bot: Bot, client: Client, guild: any, player?: Player): Promise<string> {
        const displayNames: string[] = [];

        // In DYNAMIC mode, only display the active dynamic DJs (not all admins/roles)
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC) {
            // Show dynamic DJs (excluding admins)
            const djUserIds = (player && player.djUsers) ? Array.from(player.djUsers) : [];
            for (const userId of djUserIds) {
                if (!bot.config.bot.admin.includes(userId)) {
                    displayNames.push(`<@${userId}> (D-DJ)`);
                }
            }
        }
        else {
            // STATIC mode: show all categories with deduplication (handled by getDJInfo)
            const djInfo = await this.getDJInfo(bot, client, guild, player);

            for (const userId of djInfo.admins) {
                displayNames.push(`<@${userId}> (Admin)`);
            }

            for (const userId of djInfo.roleDJs) {
                displayNames.push(`<@${userId}> (Role)`);
            }

            for (const userId of djInfo.dynamicDJs) {
                displayNames.push(`<@${userId}> (DJ)`);
            }
        }

        if (displayNames.length === 0) {
            return 'None';
        }

        return displayNames.join(', ');
    }

    /**
     * Handle DJ leaving voice channel in dynamic mode.
     * PLAY mode: Removes DJ immediately — no auto-assign. Next DJ is whoever successfully plays a song.
     * COOLDOWN mode: Removes DJ immediately, then auto-assigns next eligible member after cooldown.
     * DJ role users and admins are permanent DJs and are not affected.
     */
    public static handleDJLeave(bot: Bot, client: Client, player: Player, userId: string, voiceChannel: VoiceBasedChannel): void {
        if (bot.config.bot.djMode !== DJModeEnum.DYNAMIC || !player.djUsers?.has(userId)) {
            return;
        }

        // DJ role users are permanent — do not remove them on leave
        const guild = client.guilds.cache.get(player.guildId);
        if (guild && bot.config.bot.djRoleId) {
            const member = guild.members.cache.get(userId);
            if (member && member.roles.cache.has(bot.config.bot.djRoleId)) {
                return;
            }
        }

        // Admins are also permanent DJs — do not remove them
        if (bot.config.bot.admin.includes(userId)) {
            return;
        }

        // Remove DJ immediately in both modes
        this.removeDJ(player, userId);

        if (bot.config.bot.djLeave.mode === 'COOLDOWN') {
            // Clear any existing leave timeout before setting a new one
            this.cancelDJLeaveTimeout(player);

            player.leaveTimeout = setTimeout(() => {
                // Verify player still exists and has no DJ set
                if (this.hasDJSet(player)) {
                    return;
                }

                // If a DJ-role user is in the channel, don't auto-assign dynamic DJ
                if (this.hasDJRoleInChannel(bot, voiceChannel)) {
                    return;
                }

                // Get non-bot members in the voice channel, excluding admins and DJ-role users
                const members = voiceChannel.members.filter((m: GuildMember) =>
                    !m.user.bot &&
                    !bot.config.bot.admin.includes(m.user.id) &&
                    !(bot.config.bot.djRoleId && m.roles.cache.has(bot.config.bot.djRoleId))
                );
                if (members.size === 0) {
                    return;
                }

                // Pick the first eligible member as new DJ
                const nextDJ = members.first()!;
                this.addDJ(player, nextDJ.user.id);
                bot.logger.emit('log', bot.shardId, `[Guild ${player.guildId}] Auto-assigned DJ to <@${nextDJ.user.id}> after cooldown`);
            }, bot.config.bot.djLeave.cooldown);
        }
    }

    /**
     * Cancel any pending DJ leave timeout for a player
     */
    public static cancelDJLeaveTimeout(player: Player): void {
        if (player.leaveTimeout) {
            clearTimeout(player.leaveTimeout);
            player.leaveTimeout = undefined;
        }
    }
}
