const { color } = require(`${__dirname}/../utils/constants`);


let pool = [];

module.exports = async (client, oldState, newState) => {
    const display = client.config.displayVoiceState;

    if (newState.channelId === null) {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} left channel${color.white}`);
    }
    else if (oldState.channelId === null) {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} joined channel ${newState.channel.name}${color.white}`);
    }
    else {
        if (display) console.log(`${color.grey}-- ${newState.member.user.username} moved channel ${oldState.channel.name} to ${newState.channel.name}${color.white}`);


        // If the member who left the channel is not bot, check if the channel still has members
        if (!oldState.member.user.bot) {
            const queue = await client.player.nodes.get(oldState.guild.id);
            const botChannelId = queue?.connection?.channel?.id;
            const oldChannelId = oldState.channel.id;
            const newChannelId = newState.channel.id;

            if (botChannelId === oldChannelId) {

                // If the channel only has bot, then start counting timeout until leave
                if (oldState.channel.members.size <= 1) {

                    let timeoutID = setTimeout(() => {
                        client.player.deleteQueue(oldState.guild.id);
                    }, client.config.autoLeaveCooldown);

                    pool.push({
                        guildId: oldState.guild.id,
                        timeoutId: timeoutID
                    });
                    //console.log(pool);
                }
            }
            else if (botChannelId === newChannelId) {

                // When bot is in the target channel and only one member joined
                // If there are two members or more (not include bot) in the channel, it will not trigger
                if (newState.channel.members.size > 1 && newState.channel.members.size <= 2) {

                    // If member join bot channel, then find current channel's timeoutID to clear
                    for (var i = 0; i < pool.length; i++) {
                        //console.log(pool[i]);
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