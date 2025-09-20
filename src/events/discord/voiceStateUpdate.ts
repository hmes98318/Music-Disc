import { cst } from '../../utils/constants.js';
import { dashboard } from '../../dashboard/index.js';
import { DJManager } from '../../lib/DjManager.js';
import { DJModeEnum } from '../../@types/index.js';

import type { Client, VoiceBasedChannel, VoiceState } from 'discord.js';
import type { Bot } from '../../@types/index.js';


const pool = new Map();

// channel doesn't have anyone in blacklist => true
const checkBlacklistUsers = (channel: VoiceBasedChannel | null, blacklist: string[]) => {
    if (!channel) return false;
    const membersInChannel = channel.members.filter(member => !member.user.bot);
    return membersInChannel.some(member => blacklist.includes(member.user.id));
};


export default async (bot: Bot, client: Client, oldState: VoiceState, newState: VoiceState) => {
    // If the channel ID is the same, the function immediately terminates since it involves a state change such as muting or screen sharing.
    if (oldState.channelId === newState.channelId) return;

    const display = bot.config.bot.displayVoiceState ?? true;
    const blacklist = bot.config.blacklist || [];

    if (newState.channelId === null) {
        if (display) bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} left channel` + cst.color.white);

        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;

            if (botChannelId === oldChannelId) {
                // Handle DJ leaving in DYNAMIC mode
                if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && oldState.member && oldState.channel) {
                    const userId = oldState.member.user.id;
                    if (DJManager.isDJ(bot, userId, oldState.member, player)) {
                        DJManager.handleDJLeave(bot, client, player, userId, oldState.channel);
                    }
                }

                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (!checkBlacklistUsers(oldState.channel, blacklist)) {
                    for (const [key, value] of pool.entries()) {

                        if (key === oldState.guild.id) {
                            // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] checkBlacklistUsers.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    const timeoutID = setTimeout(async () => {
                        if (bot.config.bot.autoLeave.enabled) {
                            player.destroy();
                        }
                        else {
                            player.queue.clear();
                            await player.skip();
                            await dashboard.destroy(bot, player);
                        }
                    }, bot.config.bot.autoLeave.cooldown);

                    pool.set(oldState.guild.id, timeoutID);
                    // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] pool.add', pool);
                }
            }
        }
    }
    else if (oldState.channelId === null) {
        if (display) bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} joined channel ${newState.channel?.name}` + cst.color.white);

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

        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(newState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const newChannelId = newState.channel?.id;

            if (botChannelId === newChannelId) {
                // When bot is in the target channel and only one member joined
                // If there are two members or more (include bot) in the channel, it will not trigger
                if (checkBlacklistUsers(newState.channel, blacklist)) {
                    const timeoutID = setTimeout(async () => {
                        if (bot.config.bot.autoLeave.enabled) {
                            player.destroy();
                        }
                        else {
                            player.queue.clear();
                            await player.skip();
                            await dashboard.destroy(bot, player);
                        }
                    }, bot.config.bot.autoLeave.cooldown);

                    pool.set(newState.guild.id, timeoutID);
                    // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] checkBlacklistUsers.add', pool);
                }
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (const [key, value] of pool.entries()) {

                        if (key === newState.guild.id) {
                            // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] pool.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
            }
        }
    }
    else {
        if (display) bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} moved channel ${oldState.channel?.name} to ${newState.channel?.name}` + cst.color.white);


        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;
            const newChannelId = newState.channel?.id;

            if (botChannelId === oldChannelId) {
                // Handle DJ leaving the bot's channel (moving to another channel) in DYNAMIC mode
                if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && oldState.member && oldState.channel) {
                    const userId = oldState.member.user.id;
                    if (DJManager.isDJ(bot, userId, oldState.member, player)) {
                        DJManager.handleDJLeave(bot, client, player, userId, oldState.channel);
                    }
                }

                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (!checkBlacklistUsers(oldState.channel, blacklist)) {
                    for (const [key, value] of pool.entries()) {

                        if (key === oldState.guild.id) {
                            // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] checkBlacklistUsers.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    const timeoutID = setTimeout(async () => {
                        if (bot.config.bot.autoLeave.enabled) {
                            player.destroy();
                        }
                        else {
                            player.queue.clear();
                            await player.skip();
                            await dashboard.destroy(bot, player);
                        }
                    }, bot.config.bot.autoLeave.cooldown);

                    pool.set(oldState.guild.id, timeoutID);
                    // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] pool.add', pool);
                }
            }
            else if (botChannelId === newChannelId) {
                // Handle DJ returning to the bot's channel (moving back from another channel) in dynamic mode
                if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && newState.member && newState.channel) {
                    const userId = newState.member.user.id;
                    if (DJManager.isDJ(bot, userId, newState.member, player)) {
                        DJManager.cancelDJLeaveTimeout(player);
                    }
                }

                // When bot is in the target channel and only one member joined
                // If there are two members or more (include bot) in the channel, it will not trigger
                if (checkBlacklistUsers(newState.channel, blacklist)) {
                    const timeoutID = setTimeout(async () => {
                        if (bot.config.bot.autoLeave.enabled) {
                            player.destroy();
                        }
                        else {
                            player.queue.clear();
                            await player.skip();
                            await dashboard.destroy(bot, player);
                        }
                    }, bot.config.bot.autoLeave.cooldown);

                    pool.set(newState.guild.id, timeoutID);
                    // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] checkBlacklistUsers.add', pool);
                }
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (const [key, value] of pool.entries()) {

                        if (key === newState.guild.id) {
                            // bot.logger.emit('discord', bot.shardId, '[voiceStateUpdate] pool.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
            }
        }
    }
};
