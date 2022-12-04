module.exports = {
    name: 'leave',
    aliases: ['stop'],
    description: 'Leave current voice channel',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        queue.destroy();
        return message.react('👍');
    },
};