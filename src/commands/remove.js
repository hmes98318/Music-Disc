const embed = require('../embeds/embeds');


module.exports = {
    name: 'remove',
    aliases: ['r'],
    description: 'Select a song to remove from the playlist',
    usage: 'remove <song index number>',
    voiceChannel: true,
    options: [],

    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });


        const tracks = queue.tracks.map((track, index) => `${++index}. ${track.title}`);

        if (tracks.length < 1)
            return message.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplaying = `Now Playing : ${queue.currentTrack.title}\n\n`;
        let tracksQueue = '';

        if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += `\nand ${tracks.length - 10} other songs`;
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const instruction = `Choose a song from **1** to **${tracks.length}** to **remove** or enter others to cancel selection. ⬇️`;
        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off';
        await message.reply({ content: instruction, embeds: [embed.Embed_queue("Remove List", nowplaying, tracksQueue, loopStatus)], allowedMentions: { repliedUser: false } });


        const collector = message.channel.createMessageCollector({
            time: 10000, // 10s
            errors: ['time'],
            filter: m => m.author.id === message.author.id
        });

        collector.on('collect', async (query) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                return message.reply({ content: `✅ | Cancelled remove.`, allowedMentions: { repliedUser: false } })
                    && collector.stop();
            }

            collector.stop();
            await queue.node.remove(index - 1);

            query.reply({ embeds: [embed.Embed_remove("Removed Music", tracks[index - 1])], allowedMentions: { repliedUser: false } });
            return query.react('👍');
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time')
                return message.reply({ content: `❌ | Song remove time expired`, allowedMentions: { repliedUser: false } });
        });
    },

    async slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });


        const tracks = queue.tracks.map((track, index) => `${++index}. ${track.title}`);

        if (tracks.length < 1)
            return interaction.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });


        let nowplaying = `Now Playing : ${queue.currentTrack.title}\n\n`;
        let tracksQueue = '';

        if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += `\nand ${tracks.length - 10} other songs`;
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const instruction = `Choose a song from **1** to **${tracks.length}** to **remove** or enter others to cancel selection. ⬇️`;
        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off';
        await interaction.reply({ content: instruction, embeds: [embed.Embed_queue("Remove List", nowplaying, tracksQueue, loopStatus)], allowedMentions: { repliedUser: false } });


        const collector = interaction.channel.createMessageCollector({
            time: 10000, // 10s
            errors: ['time'],
            filter: m => m.author.id === interaction.user.id
        });

        collector.on('collect', async (query) => {
            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                return query.reply({ content: `✅ | Cancelled remove.`, allowedMentions: { repliedUser: false } })
                    && collector.stop();
            }

            collector.stop();
            await queue.node.remove(index - 1);

            query.reply({ embeds: [embed.Embed_remove("Removed Music", tracks[index - 1])], allowedMentions: { repliedUser: false } });
            return query.react('👍');
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time')
                return interaction.reply({ content: `❌ | Song remove time expired`, allowedMentions: { repliedUser: false } });
        });
    },
};