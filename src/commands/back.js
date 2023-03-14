module.exports = {
    name: 'back',
    aliases: ['b', 'rewind'],
    description: '이전 노래로 돌아갑니다.',
    usage: 'back',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });

        if (!queue.history.previousTrack)
            return message.reply({ content: `⛔ㅣ이전에는 음악이 재생되지 않았습니다.`, allowedMentions: { repliedUser: false } });

        await queue.history.back();
        return await message.react('👍');
    },

    async slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });

        if (!queue.history.previousTrack)
            return interaction.reply({ content: `⛔ㅣ이전에는 음악이 재생되지 않았습니다.`, allowedMentions: { repliedUser: false } });

        await queue.history.back();
        return await interaction.reply("✅ㅣ이전 노래로 돌아갔습니다.");
    },
};