const { QueryType } = require('discord-player');
const { SelectMenuBuilder, ActionRowBuilder } = require("discord.js");


module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'Enter song name to search',
    usage: 'search <URL/song name>',
    voiceChannel: true,
    options: [
        {
            name: "search",
            description: "The song name",
            type: 3,
            required: true
        }
    ],

    async execute(client, message, args) {

        if (!args[0])
            return message.reply({ content: `❌ | Please enter a valid song name.`, allowedMentions: { repliedUser: false } });

        const res = await client.player.search(args.join(' '), {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        })
            .catch((error) => {
                console.log(error);
                return message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
            });

        if (!res || !res?.tracks?.length)
            return message.reply({ content: `❌ | No search results found.`, allowedMentions: { repliedUser: false } });


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
                        description: x.title.length >= 25 ? `[${x.duration}] ${x.title}`.substring(0, 100) : `Duration: ${x.duration}`,
                        value: x.id
                    }
                }));
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
                if (reason == "time" && collected.size == 0) {
                    if ((!queue.current || !queue.playing) && queue.connection) queue.destroy();
                    return msg.edit({ content: "❌ | Time expired.", components: [] });
                }
            });
        }
    },

    async slashExecute(client, interaction) {
        await interaction.deferReply();

        const res = await client.player.search(interaction.options.getString("search"), {
            requestedBy: interaction.member,
            searchEngine: QueryType.AUTO
        })
            .catch((error) => {
                console.log(error);
                return message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
            });

        if (!res || !res?.tracks?.length)
            return interaction.editReply({ content: `❌ | No search results found.`, allowedMentions: { repliedUser: false } });


        const queue = await client.player.createQueue(interaction.guild, {
            metadata: interaction.channel,
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
                await queue.connect(interaction.member.voice.channel);
        } catch {
            await client.player.deleteQueue(interaction.guild.id);
            return interaction.editReply({ content: `❌ | I can't join audio channel.`, allowedMentions: { repliedUser: false } });
        }


        if (res.playlist || res.tracks.length == 1) {
            queue.addTracks(res.tracks);

            if (!queue.playing)
                await queue.play();

            return interaction.editReply("✅ | Music added.");
        }
        else {
            let select = new SelectMenuBuilder()
                .setCustomId("musicSelect")
                .setPlaceholder("Select the music")
                .setOptions(res.tracks.map(x => {
                    return {
                        label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                        description: x.title.length >= 25 ? `[${x.duration}] ${x.title}`.substring(0, 100) : `Duration: ${x.duration}`,
                        value: x.id
                    }
                }));
            let row = new ActionRowBuilder().addComponents(select);
            let msg = await interaction.editReply({ components: [row] });

            const collector = msg.createMessageComponentCollector({
                time: 20000, // 20s
                filter: i => i.user.id === interaction.user.id
            });

            collector.on("collect", async i => {
                if (i.customId != "musicSelect") return;

                queue.addTrack(res.tracks.find(x => x.id == i.values[0]));

                if (!queue.playing)
                    await queue.play();

                i.deferUpdate();
                return interaction.editReply({ content: "✅ | Music added.", components: [] });
            });

            collector.on("end", (collected, reason) => {
                if (reason == "time" && collected.size == 0) {
                    if ((!queue.current || !queue.playing) && queue.connection) queue.destroy();
                    return interaction.editReply({ content: "❌ | Time expired.", components: [] });
                }
            });
        }
    },
};