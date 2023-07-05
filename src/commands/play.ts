import { ChatInputCommandInteraction, Client, Message } from "discord.js";

export const name = 'play';
export const aliases = ['p'];
export const description = 'Enter your song link or song name to play';
export const usage = 'play <URL/song name>';
export const voiceChannel = true;
export const showHelp = true;
export const options = [
    {
        name: "search",
        description: "The song link or song name",
        type: 3,
        required: true
    }
];


export const execute = async (client: Client, message: Message, args: string[]) => {
    if (!args[0]) {
        return message.reply({ content: `❌ | Write the name of the music you want to search.`, allowedMentions: { repliedUser: false } });
    }

    const str = args.join(' ');
    const res = await client.lavashark.search(str);

    if (res.loadType === "LOAD_FAILED") {
        console.log(`Search Error: ${res.exception?.message}`);
        return message.reply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === "NO_MATCHES") {
        return message.reply({ content: `❌ | No matches.`, allowedMentions: { repliedUser: false } });
    }

    let player;
    try {
        // Creates the audio player
        player = client.lavashark.createPlayer({
            guildId: String(message.guild?.id),
            voiceChannelId: String(message.member?.voice.channelId),
            textChannelId: message.channel.id,
            selfDeaf: true
        });

        // Connects to the voice channel
        player.connect();
    } catch (error) {
        console.log(error);
        return message.reply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }


    if (res.loadType === 'PLAYLIST_LOADED') {
        for (const track of res.tracks) {
            track.setRequester(client.user);
            player.queue.add(track);
        }

        message.reply(`Playlist \`${res.playlistInfo.name}\` loaded!`);
    }
    else {
        const track = res.tracks[0];
        track.setRequester(client.user);

        player.queue.add(track);
        message.reply(`Queued \`${track.title}\``);
    }

    if (!player.playing) await player.play()
        .catch((error) => {
            console.log(error);
            return message.reply({ content: `❌ | I can't play this track.`, allowedMentions: { repliedUser: false } });
        });

    return message.react('👍');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const str = String(interaction.options.get("search", true).value);
    const res = await client.lavashark.search(str);

    if (res.loadType === "LOAD_FAILED") {
        console.log(`Search Error: ${res.exception?.message}`);
        return interaction.editReply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === "NO_MATCHES") {
        return interaction.editReply({ content: `❌ | No matches.`, allowedMentions: { repliedUser: false } });
    }

    let player;
    try {
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const { channel } = guildMember!.voice;
        // Creates the audio player
        player = client.lavashark.createPlayer({
            guildId: String(interaction.guild?.id),
            voiceChannelId: String(channel?.id),
            textChannelId: interaction.channel?.id,
            selfDeaf: true
        });

        // Connects to the voice channel
        player.connect();
    } catch (error) {
        console.log(error);
        return interaction.editReply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }


    if (res.loadType === 'PLAYLIST_LOADED') {
        for (const track of res.tracks) {
            track.setRequester(client.user);
            player.queue.add(track);
        }

        interaction.editReply(`Playlist \`${res.playlistInfo.name}\` loaded!`);
    }
    else {
        const track = res.tracks[0];
        track.setRequester(client.user);

        player.queue.add(track);
        interaction.editReply(`Queued \`${track.title}\``);
    }

    if (!player.playing) await player.play()
        .catch((error) => {
            console.log(error);
            return interaction.editReply({ content: `❌ | I can't play this track.`, allowedMentions: { repliedUser: false } });
        });
}