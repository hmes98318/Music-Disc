module.exports = {
    name: 'leave',
    aliases: ['stop'],
    utilisation: '{prefix}leave',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`❌ | There is no music currently playing.`);

        queue.destroy();

        return message.react('👍');
    },
};