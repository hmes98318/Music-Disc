import i18next from 'i18next';

import { dashboard } from '../dashboard/index.js';
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
     * Get formatted DJ display string
     */
    public static async getDJDisplayString(bot: Bot, client: Client, player?: Player): Promise<string> {
        const djUsers = this.getDJUsers(bot, player);

        if (djUsers.length === 0) {
            return 'None';
        }

        const displayUsers = djUsers.slice(0, 3);
        const displayNames: string[] = [];

        for (const userId of displayUsers) {
            try {
                const user = await client.users.fetch(userId);
                displayNames.push(`<@${user.id}>`);
            } catch (error) {
                displayNames.push(`Unknown User`);
            }
        }

        let result = displayNames.join(', ');
        if (djUsers.length > 3) {
            result += '...';
        }

        return result;
    }

    /**
     * Handle DJ leave timeout in dynamic mode (only in DYNAMIC mode)
     */
    public static handleDJLeave(bot: Bot, client: Client, player: Player, userId: string, voiceChannel: VoiceBasedChannel): void {
        if (bot.config.bot.djMode !== DJModeEnum.DYNAMIC || !player.djUsers?.has(userId)) {
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
        if (this.hasDJInChannel(player, voiceChannel)) {
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
                const dashboardChannel = player.dashboard?.channel;
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
                if (player.current && player.dashboard) {
                    await dashboard.update(bot, player, player.current);
                }
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error updating dashboard after auto DJ selection: ' + error);
            }
        }
    }

    /**
     * Check if there are any DJs in the voice channel (for dynamic mode)
     */
    public static hasDJInChannel(player: Player, voiceChannel: VoiceBasedChannel): boolean {
        if (!player.djUsers) {
            return false;
        }

        return voiceChannel.members.some(member =>
            player.djUsers!.has(member.user.id) && !member.user.bot
        );
    }
}
