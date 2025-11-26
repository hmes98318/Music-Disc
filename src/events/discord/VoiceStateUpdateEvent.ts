import { Events } from 'discord.js';

import { BaseDiscordEvent } from './base/BaseDiscordEvent.js';
import { cst } from '../../utils/constants.js';
import { DJManager } from '../../lib/DjManager.js';
import { DJModeEnum } from '../../@types/index.js';

import type { Client, VoiceBasedChannel, VoiceState } from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * VoiceStateUpdate event handler
 * Handles voice state changes for auto-leave and DJ management
 */
export class VoiceStateUpdateEvent extends BaseDiscordEvent<Events.VoiceStateUpdate> {
    // Timeout pool for auto-leave functionality
    #timeoutPool = new Map<string, NodeJS.Timeout>();

    public getEventName(): Events.VoiceStateUpdate {
        return Events.VoiceStateUpdate;
    }

    public async execute(bot: Bot, client: Client, oldState: VoiceState, newState: VoiceState): Promise<void> {
        // If the channel ID is the same, the function immediately terminates since it involves a state change such as muting or screen sharing
        if (oldState.channelId === newState.channelId) return;

        const display = bot.config.bot.displayVoiceState ?? true;
        const blacklist = bot.config.blacklist || [];

        if (newState.channelId === null) {
            // User left a voice channel
            await this.#handleUserLeave(bot, client, oldState, display, blacklist);
        }
        else if (oldState.channelId === null) {
            // User joined a voice channel
            await this.#handleUserJoin(bot, client, newState, display, blacklist);
        }
        else {
            // User moved between voice channels
            await this.#handleUserMove(bot, client, oldState, newState, display, blacklist);
        }
    }

    /**
     * Handle user leaving voice channel
     * @private
     */
    async #handleUserLeave(
        bot: Bot,
        client: Client,
        oldState: VoiceState,
        display: boolean,
        blacklist: string[]
    ): Promise<void> {
        if (display) {
            bot.logger.emit('discord', bot.shardId, `[voiceStateUpdate]${cst.color.grey} (${oldState.member?.guild.name}) ${oldState.member?.user.username} left channel${cst.color.white}`);
        }

        // If the member who left is a bot, ignore
        if (oldState.member?.user.bot) return;

        const player = client.lavashark.getPlayer(oldState.guild.id);
        if (!player) return;

        const botChannelId = player.voiceChannelId;
        const oldChannelId = oldState.channel?.id;

        if (botChannelId !== oldChannelId) return;

        // Handle DJ leaving in DYNAMIC mode
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && oldState.member && oldState.channel) {
            const userId = oldState.member.user.id;
            if (DJManager.isDJ(bot, userId, oldState.member, player)) {
                DJManager.handleDJLeave(bot, client, player, userId, oldState.channel);
            }
        }

        // Clear existing timeout if channel has valid members
        if (!this.#checkBlacklistUsers(oldState.channel, blacklist)) {
            this.#clearTimeout(oldState.guild.id);
        }

        // If channel only has bot or blacklisted users, start auto-leave timeout
        if (oldState.channel!.members.size <= 1 || this.#checkBlacklistUsers(oldState.channel, blacklist)) {
            this.#startAutoLeaveTimeout(bot, client, player, oldState.guild.id);
        }
    }

    /**
     * Handle user joining voice channel
     * @private
     */
    async #handleUserJoin(
        bot: Bot,
        client: Client,
        newState: VoiceState,
        display: boolean,
        blacklist: string[]
    ): Promise<void> {
        if (display) {
            bot.logger.emit('discord', bot.shardId, `[voiceStateUpdate]${cst.color.grey} (${newState.member?.guild.name}) ${newState.member?.user.username} joined channel ${newState.channel?.name}${cst.color.white}`);
        }

        // Handle DJ returning to channel in DYNAMIC mode
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !newState.member?.user.bot && newState.member) {
            const player = client.lavashark.getPlayer(newState.guild.id);
            if (player && newState.channel?.id === player.voiceChannelId) {
                const userId = newState.member.user.id;
                if (DJManager.isDJ(bot, userId, newState.member, player)) {
                    DJManager.cancelDJLeaveTimeout(player);
                }
            }
        }

        // If the member who joined is a bot, ignore
        if (newState.member?.user.bot) return;

        const player = client.lavashark.getPlayer(newState.guild.id);
        if (!player) return;

        const botChannelId = player.voiceChannelId;
        const newChannelId = newState.channel?.id;

        if (botChannelId !== newChannelId) return;

        // If only blacklisted users in channel, start timeout
        if (this.#checkBlacklistUsers(newState.channel, blacklist)) {
            this.#startAutoLeaveTimeout(bot, client, player, newState.guild.id);
        }

        // If valid members joined, clear timeout
        if (newState.channel!.members.size >= 2 && !this.#checkBlacklistUsers(newState.channel, blacklist)) {
            this.#clearTimeout(newState.guild.id);
        }
    }

    /**
     * Handle user moving between voice channels
     * @private
     */
    async #handleUserMove(
        bot: Bot,
        client: Client,
        oldState: VoiceState,
        newState: VoiceState,
        display: boolean,
        blacklist: string[]
    ): Promise<void> {
        if (display) {
            bot.logger.emit('discord', bot.shardId, `[voiceStateUpdate]${cst.color.grey} (${newState.member?.guild.name}) ${newState.member?.user.username} moved channel ${oldState.channel?.name} to ${newState.channel?.name}${cst.color.white}`);
        }

        // If the member who moved is a bot, ignore
        if (oldState.member?.user.bot) return;

        const player = client.lavashark.getPlayer(oldState.guild.id);
        if (!player) return;

        const botChannelId = player.voiceChannelId;
        const oldChannelId = oldState.channel?.id;
        const newChannelId = newState.channel?.id;

        // Handle leaving bot's channel
        if (botChannelId === oldChannelId) {
            // Handle DJ leaving in DYNAMIC mode
            if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && oldState.member && oldState.channel) {
                const userId = oldState.member.user.id;
                if (DJManager.isDJ(bot, userId, oldState.member, player)) {
                    DJManager.handleDJLeave(bot, client, player, userId, oldState.channel);
                }
            }

            // Clear timeout if valid members remain
            if (!this.#checkBlacklistUsers(oldState.channel, blacklist)) {
                this.#clearTimeout(oldState.guild.id);
            }

            // Start timeout if only bot or blacklisted users remain
            if (oldState.channel!.members.size <= 1 || this.#checkBlacklistUsers(oldState.channel, blacklist)) {
                this.#startAutoLeaveTimeout(bot, client, player, oldState.guild.id);
            }
        }
        // Handle joining bot's channel
        else if (botChannelId === newChannelId) {
            // Handle DJ returning in DYNAMIC mode
            if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && newState.member && newState.channel) {
                const userId = newState.member.user.id;
                if (DJManager.isDJ(bot, userId, newState.member, player)) {
                    DJManager.cancelDJLeaveTimeout(player);
                }
            }

            // Start timeout if only blacklisted users
            if (this.#checkBlacklistUsers(newState.channel, blacklist)) {
                this.#startAutoLeaveTimeout(bot, client, player, newState.guild.id);
            }

            // Clear timeout if valid members joined
            if (newState.channel!.members.size >= 2 && !this.#checkBlacklistUsers(newState.channel, blacklist)) {
                this.#clearTimeout(newState.guild.id);
            }
        }
    }

    /**
     * Check if channel only has blacklisted users (excluding bots)
     * @private
     */
    #checkBlacklistUsers(channel: VoiceBasedChannel | null, blacklist: string[]): boolean {
        if (!channel) return false;
        const membersInChannel = channel.members.filter(member => !member.user.bot);
        return membersInChannel.some(member => blacklist.includes(member.user.id));
    }

    /**
     * Start auto-leave timeout
     * @private
     */
    #startAutoLeaveTimeout(bot: Bot, client: Client, player: any, guildId: string): void {
        const timeoutID = setTimeout(async () => {
            if (bot.config.bot.autoLeave.enabled) {
                player.destroy();
            }
            else {
                player.queue.clear();
                await player.skip();
                await client.dashboard.destroy(player);
            }
        }, bot.config.bot.autoLeave.cooldown);

        this.#timeoutPool.set(guildId, timeoutID);
    }

    /**
     * Clear auto-leave timeout
     * @private
     */
    #clearTimeout(guildId: string): void {
        const timeoutID = this.#timeoutPool.get(guildId);
        if (timeoutID) {
            clearTimeout(timeoutID);
            this.#timeoutPool.delete(guildId);
        }
    }
}
