module.exports = async (client, oldState, newState) => {
    const display = client.config.displayVoiceState;
    const color = { white: '\x1B[0m', grey: '\x1B[2m' };

    if (newState.channelId === null) {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} left channel${color.white}`);
    }
    else if (oldState.channelId === null) {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} joined channel ${newState.channel.name}${color.white}`);
    }
    else {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} moved channel ${oldState.channel.name} to ${newState.channel.name}${color.white}`);


        if (!oldState.member.user.bot) { // If the member who left the channel is not bot, check if the channel still has members
            const queue = await client.player.getQueue(oldState.guild.id);
            const botChannelId = queue?.connection?.channel?.id;
            const oldStateId = oldState.channel.id;

            if (botChannelId === oldStateId) {
                if (oldState.channel.members.size <= 1) {
                    client.player.deleteQueue(oldState.guild.id);
                }
            }
        }
    }
};