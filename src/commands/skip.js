module.exports = {
    name: 'skip',
    aliases: ['s'],
    description: '현재 노래를 건너뛰기합니다.',
    usage: 'skip',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });


        if (queue.repeatMode === 1) {
            queue.setRepeatMode(0);
            queue.node.skip();
            await wait(500);
            queue.setRepeatMode(1);
        }
        else {
            queue.node.skip();
        }

        return message.react('👍');
    },

    async slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });


        if (queue.repeatMode === 1) {
            queue.setRepeatMode(0);
            queue.node.skip();
            await wait(500);
            queue.setRepeatMode(1);
        }
        else {
            queue.node.skip();
        }

        return interaction.reply('✅ㅣ음악을 건너뛰었습니다.');
    },
};




const wait = (ms) => {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
};