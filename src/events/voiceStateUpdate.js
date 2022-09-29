module.exports = async (client, oldState, newState) => {
    const display = client.config.displayVoiceState;

    if (newState.channelId === null) {
        if (display) console.log('--', newState.member.user.username, ' left channel ');
    }
    else if (oldState.channelId === null) {
        if (display) console.log('--', newState.member.user.username, ' joined channel ', newState.channel.name);
    }
    else {
        if (display) console.log('--', newState.member.user.username, ' moved channel ', oldState.channel.name, ' to ', newState.channel.name);



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