const { QueryType } = require('discord-player');


module.exports = {
    name: 'play',
    aliases: ['p'],
    description: '재생할 노래 링크 또는 노래 이름을 입력하십시오.',
    usage: 'play <노래 링크 혹은 노래 이름>',
    voiceChannel: true,
    options: [
        {
            name: "search",
            description: "재생할 노래 링크 또는 노래 이름",
            type: 3,
            required: true
        }
    ],

    async execute(client, message, args) {
        if (!args[0])
            return message.reply({ content: `⛔ㅣ검색할 음악의 이름을 입력합니다.`, allowedMentions: { repliedUser: false } });


        const results = await client.player.search(args.join(' '))
            .catch((error) => {
                console.log(error);
                return message.reply({ content: `⛔ㅣ서비스에 문제가 있습니다. 다시 시도하십시오.`, allowedMentions: { repliedUser: false } });
            });

        if (!results || !results.hasTracks())
            return message.reply({ content: `⛔ㅣ결과를 찾을 수 없습니다.`, allowedMentions: { repliedUser: false } });


        /*
        const queue = await client.player.play(message.member.voice.channel.id, results, {
            nodeOptions: {
                metadata: {
                    channel: message.channel,
                    client: message.guild.members.me,
                    requestedBy: message.user
                },
                selfDeaf: true,
                leaveOnEmpty: client.config.autoLeave,
                leaveOnEnd: client.config.autoLeave,
                leaveOnEmptyCooldown: client.config.autoLeaveCooldown,
                leaveOnEndCooldown: client.config.autoLeaveCooldown,
                volume: client.config.defaultVolume,
            }
        }); // The two play methods are the same
        */
        const queue = await client.player.nodes.create(message.guild, {
            metadata: {
                channel: message.channel,
                client: message.guild.members.me,
                requestedBy: message.user
            },
            selfDeaf: true,
            leaveOnEmpty: client.config.autoLeave,
            leaveOnEnd: client.config.autoLeave,
            leaveOnEmptyCooldown: client.config.autoLeaveCooldown,
            leaveOnEndCooldown: client.config.autoLeaveCooldown,
            volume: client.config.defaultVolume,
        });

        try {
            if (!queue.connection)
                await queue.connect(message.member.voice.channel);
        } catch (error) {
            console.log(error);
            if (!queue?.deleted) queue?.delete();
            return message.reply({ content: `⛔ㅣ음성 채널에 가입할 수 없습니다.`, allowedMentions: { repliedUser: false } });
        }

        results.playlist ? queue.addTrack(results.tracks) : queue.addTrack(results.tracks[0]);

        if (!queue.isPlaying())
            await queue.node.play();

        return message.react('👍');
    },

    async slashExecute(client, interaction) {

        const results = await client.player.search(interaction.options.getString("search"))
            .catch((error) => {
                console.log(error);
                return interaction.reply({ content: `⛔ㅣ서비스에 문제가 있습니다. 다시 시도하십시오.`, allowedMentions: { repliedUser: false } });
            });

        if (!results || !results.tracks.length)
            return interaction.reply({ content: `⛔ㅣ결과를 찾을 수 없습니다.`, allowedMentions: { repliedUser: false } });


        const queue = await client.player.nodes.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user
            },
            selfDeaf: true,
            leaveOnEmpty: client.config.autoLeave,
            leaveOnEnd: client.config.autoLeave,
            leaveOnEmptyCooldown: client.config.autoLeaveCooldown,
            leaveOnEndCooldown: client.config.autoLeaveCooldown,
            volume: client.config.defaultVolume,
        });

        try {
            if (!queue.connection)
                await queue.connect(interaction.member.voice.channel);
        } catch (error) {
            console.log(error);
            if (!queue?.deleted) queue?.delete();
            return interaction.reply({ content: `⛔ㅣ음성 채널에 가입할 수 없습니다.`, allowedMentions: { repliedUser: false } });
        }

        results.playlist ? queue.addTracks(results.tracks) : queue.addTrack(results.tracks[0]);

        if (!queue.isPlaying())
            await queue.node.play();

        return interaction.reply("✅ㅣ음악이 추가되었습니다.");
    },
};