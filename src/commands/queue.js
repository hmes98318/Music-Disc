const embed = require('../embeds/embeds');


module.exports = {
    name: 'queue',
    aliases: ['q', 'list'],
    description: 'Show playlist',
    usage: 'queue',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);


        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        if (!queue.tracks[0])
            return message.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplay = `Now Playing : ${queue.current.title}\n\n`;
        let queueMsg = '';
        if (queue.tracks.length > 9) {
            for (var i = 0; i <= 9; i++) {
                queueMsg += `${i + 1}. ${queue.tracks[i].title}\n`;
            }
            queueMsg += `and ${queue.tracks.length - 10} other songs`;
        }
        else {
            for (var i = 0; i < queue.tracks.length; i++) {
                queueMsg += `${i + 1}. ${queue.tracks[i].title}\n`;
            }
        }

        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'One') : 'Off';
        return message.reply({ embeds: [embed.Embed_queue("Queue List", nowplay, queueMsg, loopStatus)], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);


        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        if (!queue.tracks[0])
            return interaction.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplay = `Now Playing : ${queue.current.title}\n\n`;
        let queueMsg = '';
        if (queue.tracks.length > 9) {
            for (var i = 0; i <= 9; i++) {
                queueMsg += `${i + 1}. ${queue.tracks[i].title}\n`;
            }
            queueMsg += `and ${queue.tracks.length - 9} other songs`;
        }
        else {
            for (var i = 0; i < queue.tracks.length; i++) {
                queueMsg += `${i + 1}. ${queue.tracks[i].title}\n`;
            }
        }

        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'One') : 'Off';
        return interaction.reply({ embeds: [embed.Embed_queue("Queue List", nowplay, queueMsg, loopStatus)] });
    },
};