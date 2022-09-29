module.exports = {
    name: 'skip',
    aliases: ['s'],
    utilisation: '{prefix}skip',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`❌ | There is no music currently playing.`);

        queue.skip();

        return message.react('👍');
    },
};