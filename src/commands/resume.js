module.exports = {
    name: 'resume',
    aliases: [],
    description: 'Resume paused song',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        const success = queue.setPaused(false);

        return success ? message.react('▶️') : message.reply({ content: `❌ | Something went wrong.`, allowedMentions: { repliedUser: false } });
    },
};