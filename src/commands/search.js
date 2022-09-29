const { QueryType } = require('discord-player');
const embed = require('../embeds/embeds');


module.exports = {
    name: 'search',
    aliases: ['find'],
    utilisation: '{prefix}search [song name]',
    voiceChannel: true,

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`❌ | Please enter a valid song name.`);

        const res = await client.player.search(args.join(' '), {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) return message.channel.send(`❌ | No search results found.`);

        const queue = await client.player.createQueue(message.guild, {
            metadata: message.channel,
            leaveOnEnd: client.config.autoLeave,
            leaveOnStop: client.config.autoLeave,
            leaveOnEmpty: client.config.autoLeave,
            ytdlOptions: {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        });


        let title = `Searched Music: ${args.join(' ')}`
        const maxTracks = res.tracks.slice(0, 5);
        let description = `${maxTracks.map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`).join('\n\n')}\n\nChoose a song from **1** - **${maxTracks.length}** to send or enter others to cancel selection. ⬇️`;

        message.channel.send({ embeds: [embed.Embed_search(title, description)] });

        const collector = message.channel.createMessageCollector({
            time: 15000,
            errors: ['time'],
            filter: m => m.author.id === message.author.id
        });

        collector.on('collect', async (query) => {

            const value = parseInt(query.content);

            if (!value || value <= 0 || value > maxTracks.length)
                return message.channel.send(`✅ | Call cancelled.`) && collector.stop();

            collector.stop();

            try {
                if (!queue.connection)
                    await queue.connect(message.member.voice.channel);
            } catch {
                await client.player.deleteQueue(message.guild.id);
                return message.channel.send(`❌ | I can't join audio channel.`);
            }

            await message.react('👍');

            queue.addTrack(res.tracks[Number(query.content) - 1]);

            if (!queue.playing)
                await queue.play();
        });

        collector.on('end', (msg, reason) => {
            if (reason === 'time')
                return message.channel.send(`❌ | Song search time expired`);
        });
    },
};