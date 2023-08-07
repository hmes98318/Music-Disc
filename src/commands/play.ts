import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { dashboard } from "../dashboard";


export const name = 'play';
export const aliases = ['p'];
export const description = 'Enter your song link or song name to play';
export const usage = 'play <URL/song name>';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: "play",
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


    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(message.guild?.id),
        voiceChannelId: String(message.member?.voice.channelId),
        textChannelId: message.channel.id,
        selfDeaf: true
    });

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = message;

        // Intial dashboard
        if (!player.dashboard) await dashboard.initial(client, message, player);
    } catch (error) {
        console.log(error);
        await dashboard.destroy(player, client.config.embedsColor);
        return message.reply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }


    if (res.loadType === 'PLAYLIST_LOADED') {
        player.addTracks(res.tracks, message.author);
    }
    else {
        const track = res.tracks[0];
        player.addTracks(track, message.author);
    }

    if (!player.playing) {
        await player.play()
            .catch(async (error) => {
                console.log(error);
                await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                return await player.destroy();
            });

        player.filters.setVolume(client.config.defaultVolume);
    }

    return message.react('👍');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const str = interaction.options.getString("play");
    const res = await client.lavashark.search(str!);

    if (res.loadType === "LOAD_FAILED") {
        console.log(`Search Error: ${res.exception?.message}`);
        return interaction.editReply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === "NO_MATCHES") {
        return interaction.editReply({ content: `❌ | No matches.`, allowedMentions: { repliedUser: false } });
    }


    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;
    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(interaction.guild?.id),
        voiceChannelId: String(channel?.id),
        textChannelId: interaction.channel?.id,
        selfDeaf: true
    });

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = interaction;

        // Intial dashboard
        if (!player.dashboard) {
            await dashboard.initial(client, interaction, player);
        }
    } catch (error) {
        console.log(error);
        await dashboard.destroy(player, client.config.embedsColor);
        return interaction.editReply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }


    if (res.loadType === 'PLAYLIST_LOADED') {
        player.addTracks(res.tracks, interaction.user);
    }
    else {
        const track = res.tracks[0];
        player.addTracks(track, interaction.user);
    }

    if (!player.playing) {
        await player.play()
            .catch(async (error) => {
                console.log(error);
                await interaction.editReply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                return await player.destroy();
            });

        player.filters.setVolume(client.config.defaultVolume);
    }

    return interaction.editReply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
}