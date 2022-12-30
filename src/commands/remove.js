const embed = require('../embeds/embeds');


module.exports = {
    name: 'remove',
    aliases: ['r'],
    description: 'Select a song to remove from the playlist',
    usage: 'remove <song index number>',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);


        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        if (!queue.tracks[0])
            return message.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplaying = `Now Playing : ${queue.current.title}`;
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
        const instruction = `Choose a song from **1** to **${queue.tracks.length}** to **remove** or enter others to cancel selection. ⬇️`
        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off';
        await message.reply({ content: instruction, embeds: [embed.Embed_queue("Remove List", nowplaying, queueMsg, loopStatus)], allowedMentions: { repliedUser: false } });


        const collector = message.channel.createMessageCollector({
            time: 10000, // 10s
            errors: ['time'],
            filter: m => m.author.id === message.author.id
        });

        collector.on('collect', async (query) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > queue.tracks.length)
                return message.reply({
                    content: `✅ | Cancelled remove.`,
                    allowedMentions: { repliedUser: false }
                }) && collector.stop();

            collector.stop();


            query.reply({
                embeds: [embed.Embed_remove("Removed Music", queue.tracks[index - 1].title)],
                allowedMentions: { repliedUser: false }
            });
            queue.remove(index - 1);
            return query.react('👍');
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time')
                return message.channel.send(`❌ | Song remove time expired`);
        });
    },

    async slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);


        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        if (!queue.tracks[0])
            return interaction.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplaying = `Now Playing : ${queue.current.title}`;
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
        const instruction = `Choose a song from **1** to **${queue.tracks.length}** to **remove** or enter others to cancel selection. ⬇️`
        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off';
        await interaction.reply({ content: instruction, embeds: [embed.Embed_queue("Remove List", nowplaying, queueMsg, loopStatus)], allowedMentions: { repliedUser: false } });


        const collector = interaction.channel.createMessageCollector({
            time: 10000, // 10s
            errors: ['time'],
            filter: m => m.author.id === interaction.user.id
        });

        collector.on('collect', async (query) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > queue.tracks.length)
                return query.reply({
                    content: `✅ | Cancelled remove.`,
                    allowedMentions: { repliedUser: false }
                }) && collector.stop();

            collector.stop();


            query.reply({
                embeds: [embed.Embed_remove("Removed Music", queue.tracks[index - 1].title)],
                allowedMentions: { repliedUser: false }
            });
            queue.remove(index - 1);
            return query.react('👍');
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time')
                return interaction.channel.send(`❌ | Song remove time expired`);
        });
    },
};