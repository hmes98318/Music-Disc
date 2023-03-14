module.exports = {
    name: 'leave',
    aliases: ['stop'],
    description: '봇이 현재 음성 채널에서 나갑니다.',
    usage: 'leave',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });

        if (!queue.deleted)
            queue.delete();

        return message.react('👍');
    },

    slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });

        if (!queue.deleted)
            queue.delete();

        return interaction.reply('✅ㅣ봇이 떠났습니다!');
    },
};
