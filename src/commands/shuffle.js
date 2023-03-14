module.exports = {
    name: 'shuffle',
    aliases: ['random'],
    description: '노래를 랜덤으로 재생합니다.',
    usage: 'random',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다!`, allowedMentions: { repliedUser: false } });

        queue.tracks.shuffle();
        return message.react('👍');
    },

    slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다!.`, allowedMentions: { repliedUser: false } });

        queue.tracks.shuffle();
        return interaction.reply('✅ㅣ음악을 랜덤으로 재생합니다.');
    },
};