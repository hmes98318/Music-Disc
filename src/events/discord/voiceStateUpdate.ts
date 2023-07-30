import { Client, VoiceBasedChannel, VoiceState } from "discord.js";


let pool: any = [];

const checkBlacklistUsers = (channel: VoiceBasedChannel | null, blacklist: string[]) => {
    if (!channel) return false;
    const membersInChannel = channel.members.filter(member => !member.user.bot);
    return membersInChannel.every(member => blacklist.includes(member.user.id));
};


export default async (client: Client, oldState: VoiceState, newState: VoiceState) => {
    const display = client.config.displayVoiceState ?? true;
    const blacklist = client.config.blacklist || [];

    if (newState.channelId === null) {
        if (display) console.log(`-- ${newState.member?.user.username} left channel`);

        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;

            if (botChannelId === oldChannelId) {
                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    let timeoutID = setTimeout(() => {
                        player.destroy();
                    }, client.config.autoLeaveCooldown);

                    pool.push({
                        guildId: oldState.guild.id,
                        timeoutId: timeoutID
                    });
                    // console.log('pool.add', pool);
                }
            }
        }
    }
    else if (oldState.channelId === null) {
        if (display) console.log(`-- ${newState.member?.user.username} joined channel ${newState.channel?.name}`);

        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(newState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const newChannelId = newState.channel?.id;

            if (botChannelId === newChannelId) {
                // When bot is in the target channel and only one member joined
                // If there are two members or more (include bot) in the channel, it will not trigger
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (var i = 0; i < pool.length; i++) {
                        // console.log('pool.del',pool[i]);

                        if (pool[i].guildId === newState.guild.id) {
                            clearTimeout(pool[i].timeoutId);
                            pool.splice(i, 1);
                        }
                    }
                }
            }
        }
    }
    else {
        if (display) console.log(`-- ${newState.member?.user.username} moved channel ${oldState.channel?.name} to ${newState.channel?.name}`);


        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member?.user.bot) {
            const player = client.lavashark.getPlayer(oldState.guild.id);
            if (!player) return;

            const botChannelId = player?.voiceChannelId;
            const oldChannelId = oldState.channel?.id;
            const newChannelId = newState.channel?.id;

            if (botChannelId === oldChannelId) {
                // If the channel only has the bot or users in the blacklist, then start counting timeout until leave
                if (oldState.channel!.members.size <= 1 || checkBlacklistUsers(oldState.channel, blacklist)) {
                    let timeoutID = setTimeout(() => {
                        player.destroy();
                    }, client.config.autoLeaveCooldown);

                    pool.push({
                        guildId: oldState.guild.id,
                        timeoutId: timeoutID
                    });
                    // console.log('pool.add', pool);
                }
            }
            else if (botChannelId === newChannelId) {
                // When bot is in the target channel and only one member joined
                // If there are two members or more (include bot) in the channel, it will not trigger
                if (newState.channel!.members.size >= 2 && !checkBlacklistUsers(newState.channel, blacklist)) {
                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (var i = 0; i < pool.length; i++) {
                        // console.log('pool.del',pool[i]);

                        if (pool[i].guildId === newState.guild.id) {
                            clearTimeout(pool[i].timeoutId);
                            pool.splice(i, 1);
                        }
                    }
                }
            }
        }
    }
};