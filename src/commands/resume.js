module.exports = {
    name: 'resume',
    aliases: [],
    description: 'Resume paused song',
    usage: 'resume',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        const success = queue.setPaused(false);
        return success ? message.react('▶️') : message.reply({ content: `❌ | Something went wrong.`, allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);

        if (!queue)
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        const success = queue.setPaused(false);
        return success ? interaction.reply("▶️ | Music resumed.") : interaction.reply({ content: `❌ | Something went wrong.`, allowedMentions: { repliedUser: false } });
    },
};