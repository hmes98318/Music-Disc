module.exports = {
    name: 'back',
    aliases: ['rewind'],
    description: 'Back to previous song',
    voiceChannel: true,

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | No music currently playing.`, allowedMentions: { repliedUser: false } });

        if (!queue.previousTracks[1])
            return message.reply({ content: `❌ | There was no music playing before.`, allowedMentions: { repliedUser: false } });

        await queue.back();
        return await message.react('👍');
    },
};