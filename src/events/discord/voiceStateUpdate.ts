import { cst } from "../../utils/constants";

import type { Client, VoiceBasedChannel, VoiceState } from "discord.js";
import type { Bot } from "../../@types";


const pool = new Map();

// channel doesn't have anyone in blacklist => true
const checkBlacklistUsers = (channel: VoiceBasedChannel | null, blacklist: string[]) => {
    if (!channel) return false;
    const membersInChannel = channel.members.filter(member => !member.user.bot);
    return membersInChannel.some(member => blacklist.includes(member.user.id));
};


export default async (bot: Bot, client: Client, oldState: VoiceState, newState: VoiceState) => {
    const display = bot.config.displayVoiceState ?? true;
    const blacklist = bot.blacklist || [];

    if (newState.channelId === null) {
        if (display) bot.logger.emit('discord', '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} left channel` + cst.color.white);

        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;

            if (botChannelId === oldChannelId) {
                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (!checkBlacklistUsers(oldState.channel, blacklist)) {
                    for (const [key, value] of pool.entries()) {

                        if (key === oldState.guild.id) {
                            // bot.logger.emit('discord', '[voiceStateUpdate] checkBlacklistUsers.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    const timeoutID = setTimeout(() => {
                        player.destroy();

                    }, bot.config.autoLeaveCooldown);

                    pool.set(oldState.guild.id, timeoutID);
                    // bot.logger.emit('discord', '[voiceStateUpdate] pool.add', pool);
                }
            }
        }
    }
    else if (oldState.channelId === null) {
        if (display) bot.logger.emit('discord', '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} joined channel ${newState.channel?.name}` + cst.color.white);

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
                    const timeoutID = setTimeout(() => {
                        player.destroy();

                    }, bot.config.autoLeaveCooldown);

                    pool.set(newState.guild.id, timeoutID);
                    // bot.logger.emit('discord', '[voiceStateUpdate] checkBlacklistUsers.add', pool);
                }
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (const [key, value] of pool.entries()) {

                        if (key === newState.guild.id) {
                            // bot.logger.emit('discord', '[voiceStateUpdate] pool.del', pool);
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
        if (display) bot.logger.emit('discord', '[voiceStateUpdate]' + cst.color.grey + ` (${newState.member?.guild.name}) ${newState.member?.user.username} moved channel ${oldState.channel?.name} to ${newState.channel?.name}` + cst.color.white);


        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;
            const newChannelId = newState.channel?.id;

            if (botChannelId === oldChannelId) {
                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (!checkBlacklistUsers(oldState.channel, blacklist)) {
                    for (const [key, value] of pool.entries()) {

                        if (key === oldState.guild.id) {
                            // bot.logger.emit('discord', '[voiceStateUpdate] checkBlacklistUsers.del', pool);
                            clearTimeout(value);
                            pool.delete(value);
                            break;
                        }
                    }
                }
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    const timeoutID = setTimeout(() => {
                        player.destroy();

                    }, bot.config.autoLeaveCooldown);

                    pool.set(oldState.guild.id, timeoutID);
                    // bot.logger.emit('discord', '[voiceStateUpdate] pool.add', pool);
                }
            }
            else if (botChannelId === newChannelId) {
                // When bot is in the target channel and only one member joined
                // If there are two members or more (include bot) in the channel, it will not trigger
                if (checkBlacklistUsers(newState.channel, blacklist)) {
                    const timeoutID = setTimeout(() => {
                        player.destroy();

                    }, bot.config.autoLeaveCooldown);

                    pool.set(newState.guild.id, timeoutID);
                    // bot.logger.emit('discord', '[voiceStateUpdate] checkBlacklistUsers.add', pool);
                }
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (const [key, value] of pool.entries()) {

                        if (key === newState.guild.id) {
                            // bot.logger.emit('discord', '[voiceStateUpdate] pool.del', pool);
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