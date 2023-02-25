module.exports = {
    name: 'time',
    aliases: ["t"],
    description: 'show the current time of the song',
    usage: 'time',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing!.`, allowedMentions: { repliedUser: false } });

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress == 'Infinity')
            return message.reply({ content: `❌ | This song is live streaming, no duration data to display.`, allowedMentions: { repliedUser: false } });

        return message.reply({ content: `${progress} (**${timestamp.progress}**%)`, allowedMentions: { repliedUser: false } });
    },

    async slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing!.`, allowedMentions: { repliedUser: false } });

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress == 'Infinity')
            return interaction.reply({ content: `❌ | This song is live streaming, no duration data to display.`, allowedMentions: { repliedUser: false } });

        return interaction.reply({ content: `${progress} (**${timestamp.progress}**%)`, allowedMentions: { repliedUser: false } });
    },
};