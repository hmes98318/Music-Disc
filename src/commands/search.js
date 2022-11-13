const { QueryType } = require('discord-player');
let { SelectMenuBuilder, ActionRowBuilder } = require("discord.js");

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
            initialVolume: client.config.defaultVolume,
            ytdlOptions: client.config.ytdlOptions
        });

        try {
            if (!queue.connection)
                await queue.connect(message.member.voice.channel);
        } catch {
            await client.player.deleteQueue(message.guild.id);
            return message.channel.send(`❌ | I can't join audio channel.`);
        }

        await message.react('👍');

        if (res.playlist || res.tracks.length == 1) {
            queue.addTracks(res.tracks);

            if (!queue.playing)
                await queue.play();

            return message.reply("✅ | Music added.");
        }
        else {
            let select = new SelectMenuBuilder()
                .setCustomId("musicSelect")
                .setPlaceholder("Select the music")
                .setOptions(res.tracks.map(x => {
                    return {
                        label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                        description: x.title.length >= 25 ? `${x.title} [${x.duration}]`.substring(0, 100) : `Duration: ${x.duration}`,
                        value: x.id
                    }
                }))
            let row = new ActionRowBuilder().addComponents(select);
            let msg = await message.reply({ components: [row] });

            const collector = msg.createMessageComponentCollector({
                time: 20000, // 20s
                filter: i => i.user.id === message.author.id
            });

            collector.on("collect", async i => {
                if (i.customId != "musicSelect") return;

                queue.addTrack(res.tracks.find(x => x.id == i.values[0]));

                if (!queue.playing)
                    await queue.play();

                i.deferUpdate();
                return msg.edit({ content: "✅ | Music added.", components: [] });
            });

            collector.on("end", (collected, reason) => {
                if (reason == "time" && collected.size == 0)
                    return msg.edit({ content: "❌ | Time expired.", components: [] });
            });
        }
    },
};