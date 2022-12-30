module.exports = {
    name: 'pause',
    aliases: [],
    description: 'Pause current song',
    usage: 'pause',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing!.`, allowedMentions: { repliedUser: false } });

        const success = queue.setPaused(true);
        return success ? message.react('⏸️') : message.reply({ content: `❌ | Something went wrong.`, allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing!.`, allowedMentions: { repliedUser: false } });

        const success = queue.setPaused(true);
        return success ? interaction.reply("⏸️ | Music paused.") : interaction.reply({ content: `❌ | Something went wrong.`, allowedMentions: { repliedUser: false } });
    },
};