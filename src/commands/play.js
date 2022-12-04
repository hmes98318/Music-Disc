const { QueryType } = require('discord-player');


module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Enter your song link or song name to play',
    voiceChannel: true,

    async execute(client, message, args) {
        if (!args[0])
            return message.reply({ content: `❌ | Write the name of the music you want to search.`, allowedMentions: { repliedUser: false } });

        const res = await client.player.search(args.join(' '), {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length)
            return message.reply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });

        const queue = await client.player.createQueue(message.guild, {
            metadata: message.channel,
            leaveOnEnd: client.config.autoLeave,
            leaveOnEndCooldown: client.config.autoLeaveCooldown,
            leaveOnStop: client.config.autoLeave,
            leaveOnEmpty: client.config.autoLeave,
            leaveOnEmptyCooldown: client.config.autoLeaveCooldown,
            initialVolume: client.config.defaultVolume,
            ytdlOptions: client.config.ytdlOptions
        });

        try {
            if (!queue.connection)
                await queue.connect(message.member.voice.channel);
        } catch {
            await client.player.deleteQueue(message.guild.id);
            return message.reply({ content: `❌ | I can't join audio channel.`, allowedMentions: { repliedUser: false } });
        }

        await message.react('👍');

        res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

        if (!queue.playing)
            await queue.play();
    },
};