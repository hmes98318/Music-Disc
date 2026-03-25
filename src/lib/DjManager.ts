import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { DJModeEnum } from '../@types/index.js';

import type { VoiceBasedChannel, GuildMember, Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';


/**
 * DJ Management utilities for both static and dynamic DJ modes
 */
export class DJManager {
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
     * Add a user as DJ in dynamic mode
     */
    public static addDJ(player: Player, userId: string): void {
        if (!player.djUsers) {
            player.djUsers = new Set();
        }

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
            const djUserIds = (player && player.djUsers) ? Array.from(player.djUsers) : [];
            for (const userId of djUserIds) {
                displayNames.push(`<@${userId}> (DJ)`);
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
     * Handle DJ leave timeout in dynamic mode (only in DYNAMIC mode)
     * DJ role users are permanent DJs and are not subject to dynamic removal.
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

        // Clear existing timeout if any
        if (player.djLeaveTimeout) {
            clearTimeout(player.djLeaveTimeout);
        }

        // Set new timeout
        player.djLeaveTimeout = setTimeout(async () => {
            // Remove the DJ who left
            this.removeDJ(player, userId);
            await this.autoSelectNewDJ(bot, client, player, voiceChannel);
        }, bot.config.bot.djLeaveCooldown);
    }

    /**
     * Cancel DJ leave timeout when DJ returns
     */
    public static cancelDJLeaveTimeout(player: Player): void {
        if (player.djLeaveTimeout) {
            clearTimeout(player.djLeaveTimeout);
            player.djLeaveTimeout = undefined;
        }
    }

    /**
     * Automatically select a new DJ from voice channel members (only in DYNAMIC mode)
     */
    public static async autoSelectNewDJ(bot: Bot, client: Client, player: Player, voiceChannel: VoiceBasedChannel): Promise<void> {
        if (bot.config.bot.djMode !== DJModeEnum.DYNAMIC) {
            return;
        }

        // Check if there are still DJs in the voice channel
        if (this.hasDJInChannel(bot, player, voiceChannel)) {
            return; // Don't auto-select if there are still DJs in the channel
        }

        // Get non-bot members from voice channel
        const availableMembers = voiceChannel.members.filter(member =>
            !member.user.bot &&
            !bot.config.blacklist.includes(member.user.id) &&
            (!player.djUsers || !player.djUsers.has(member.user.id))
        );

        if (availableMembers.size === 0) {
            return;
        }

        // Select first available member as new DJ
        const newDJ = availableMembers.first();
        if (newDJ) {
            this.addDJ(player, newDJ.user.id);

            // Send message to dashboard channel
            try {
                const dashboardChannel = player.dashboardMsg?.channel;
                if (dashboardChannel && 'send' in dashboardChannel) {
                    await dashboardChannel.send({
                        embeds: [embeds.textSuccessMsg(bot, i18next.t('commands:MESSAGE_DJ_AUTO_SELECT', { userId: newDJ.user.id }))]
                    });
                }
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error sending auto DJ message: ' + error);
            }

            // Update dashboard to reflect new DJ
            try {
                if (player.current && player.dashboardMsg) {
                    await client.dashboard.update(player, player.current);
                }
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error updating dashboard after auto DJ selection: ' + error);
            }
        }
    }

    /**
     * Check if there are any DJs in the voice channel (for dynamic mode)
     */
    public static hasDJInChannel(bot: Bot, player: Player, voiceChannel: VoiceBasedChannel): boolean {
        // Check for admins in the channel
        const hasAdmin = voiceChannel.members.some(member =>
            !member.user.bot && bot.config.bot.admin.includes(member.user.id)
        );
        if (hasAdmin) {
            return true;
        }

        // Check for role-based DJs in the channel
        if (bot.config.bot.djRoleId) {
            const hasRoleDJ = voiceChannel.members.some(member => 
                !member.user.bot && member.roles.cache.has(bot.config.bot.djRoleId!)
            );
            if (hasRoleDJ) {
                return true;
            }
        }
        
        // Check for dynamic DJs
        if (!player.djUsers) {
            return false;
        }
        
        return voiceChannel.members.some(member =>
            player.djUsers!.has(member.user.id) && !member.user.bot
        );
    }
}
