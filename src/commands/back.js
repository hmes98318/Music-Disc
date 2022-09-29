module.exports = {
    name: 'back',
    aliases: ['rewind'],
    utilisation: '{prefix}back',
    voiceChannel: true,

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`❌ | No music currently playing.`);

        if (!queue.previousTracks[1])
            return message.channel.send(`❌ | There was no music playing before.`);

        await queue.back();

        return await message.react('👍');
    },
};