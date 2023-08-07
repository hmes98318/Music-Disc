import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";
import { dashboard } from "../dashboard";


export const name = 'search';
export const aliases = ['find'];
export const description = 'Enter song name to search';
export const usage = 'search <URL/song name>';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: "search",
        description: "The song name",
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

    await message.react('👍');


    if (res.loadType === 'PLAYLIST_LOADED') {
        player.addTracks(res.tracks, message.author);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    console.log(error);
                    await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return await player.destroy();
                });

            player.filters.setVolume(client.config.defaultVolume);
        }

        return message.reply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else if (res.tracks.length === 1) {
        const track = res.tracks[0];
        player.addTracks(track, message.author);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    console.log(error);
                    await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return await player.destroy();
                });

            player.filters.setVolume(client.config.defaultVolume);
        }

        return message.reply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else {
        let select = new StringSelectMenuBuilder()
            .setCustomId("musicSelect")
            .setPlaceholder("Select the music")
            .setOptions(res.tracks.map(x => {
                return {
                    label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                    description: `Duration: ${x.duration.label}`,
                    value: x.uri
                }
            }));
        let row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        let msg = await message.reply({ components: [row.toJSON()] });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.customId != "musicSelect") return;

            player.addTracks(res.tracks.find(x => x.uri == i.values[0])!, message.author);

            if (!player.playing) {
                await player.play()
                    .catch(async (error) => {
                        console.log(error);
                        await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                        return await player.destroy();
                    });

                player.filters.setVolume(client.config.defaultVolume);
            }

            i.deferUpdate();
            await msg.edit({ content: "✅ | Music added.", components: [], allowedMentions: { repliedUser: false } });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                if (!player.playing) await player.destroy();
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const str = interaction.options.getString("search");
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
        if (!player.dashboard) await dashboard.initial(client, interaction, player);
    } catch (error) {
        console.log(error);
        await dashboard.destroy(player, client.config.embedsColor);
        return interaction.editReply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }


    if (res.loadType === 'PLAYLIST_LOADED') {
        player.addTracks(res.tracks, interaction.user);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    console.log(error);
                    await interaction.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return await player.destroy();
                });

            player.filters.setVolume(client.config.defaultVolume);
        }

        return interaction.editReply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else if (res.tracks.length === 1) {
        const track = res.tracks[0];
        player.addTracks(track, interaction.user);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    console.log(error);
                    await interaction.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return await player.destroy();
                });

            player.filters.setVolume(client.config.defaultVolume);
        }

        return interaction.editReply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else {
        let select = new StringSelectMenuBuilder()
            .setCustomId("musicSelect")
            .setPlaceholder("Select the music")
            .setOptions(res.tracks.map(x => {
                return {
                    label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                    description: `Duration: ${x.duration.label}`,
                    value: x.uri
                }
            }));
        let row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        let msg = await interaction.editReply({ components: [row.toJSON()] });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === interaction.user.id
        });

        collector.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.customId != "musicSelect") return;

            player.addTracks(res.tracks.find(x => x.uri == i.values[0])!, interaction.user);

            if (!player.playing) {
                await player.play()
                    .catch(async (error) => {
                        console.log(error);
                        await interaction.editReply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                        return await player.destroy();
                    });

                player.filters.setVolume(client.config.defaultVolume);
            }

            i.deferUpdate();
            await msg.edit({ content: "✅ | Music added.", components: [], allowedMentions: { repliedUser: false } });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                if (!player.playing) await player.destroy();
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
}