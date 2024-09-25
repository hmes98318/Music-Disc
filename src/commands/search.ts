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
import { embeds } from "../embeds";
import { isUserInBlacklist } from "../utils/functions/isUserInBlacklist";
import { LoadType } from "../@types";

import type { Bot } from "../@types";


export const name = 'search';
export const aliases = ['find'];
export const description = 'Enter song name to search';
export const usage = 'search <URL/song name>';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "search",
        description: "The song name",
        type: 3,
        required: true
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    if (!args[0]) {
        return message.reply({ content: `❌ | Write the name of the music you want to search.`, allowedMentions: { repliedUser: false } });
    }

    const str = args.join(' ');
    const res = await client.lavashark.search(str);

    if (res.loadType === LoadType.ERROR) {
        bot.logger.emit('error', bot.shardId, `Search Error: ${res.exception?.message}`);
        return message.reply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === LoadType.EMPTY) {
        return message.reply({ content: `❌ | No matches.`, allowedMentions: { repliedUser: false } });
    }


    const validBlackist = isUserInBlacklist(message.member?.voice.channel, bot.blacklist);
    if (validBlackist.length > 0) {
        return message.reply({
            embeds: [embeds.blacklist(bot.config.embedsColor, validBlackist)],
            allowedMentions: { repliedUser: false }
        });
    }


    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(message.guild?.id),
        voiceChannelId: String(message.member?.voice.channelId),
        textChannelId: message.channel.id,
        selfDeaf: true
    });

    if (!player.setting) {
        player.setting = {
            queuePage: null,
            volume: null
        };
    }

    const curVolume = player.setting.volume ?? bot.config.defaultVolume;

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = message;
        player.filters.setVolume(curVolume);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
        return message.reply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }

    try {
        // Intial dashboard
        if (!player.dashboard) await dashboard.initial(bot, message, player);
    } catch (error) {
        await dashboard.destroy(bot, player, bot.config.embedsColor);
    }

    await message.react('👍');


    if (res.loadType === LoadType.PLAYLIST) {
        player.addTracks(res.tracks, message.author);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return player.destroy();
                });
        }

        return message.reply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else if (res.tracks.length === 1) {
        const track = res.tracks[0];
        player.addTracks(track, message.author);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return player.destroy();
                });

            player.filters.setVolume(bot.config.defaultVolume);
        }

        return message.reply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else {
        const select = new StringSelectMenuBuilder()
            .setCustomId("musicSelect")
            .setPlaceholder("Select the music")
            .setOptions(res.tracks.map(x => {
                return {
                    label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                    description: `Duration: ${x.duration.label}`,
                    value: x.uri
                };
            }));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await message.reply({ components: [row.toJSON()] });

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
                        bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                        await message.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                        return player.destroy();
                    });

                player.filters.setVolume(bot.config.defaultVolume);
            }

            i.deferUpdate();
            await msg.edit({ content: "✅ | Music added.", components: [], allowedMentions: { repliedUser: false } });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                if (!player.playing) player.destroy();
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const str = interaction.options.getString("search");
    const res = await client.lavashark.search(str!);

    if (res.loadType === LoadType.ERROR) {
        bot.logger.emit('error', bot.shardId, `Search Error: ${res.exception?.message}`);
        return interaction.editReply({ content: `❌ | No results found.`, allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === LoadType.EMPTY) {
        return interaction.editReply({ content: `❌ | No matches.`, allowedMentions: { repliedUser: false } });
    }


    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    const validBlackist = isUserInBlacklist(channel, bot.blacklist);
    if (validBlackist.length > 0) {
        return interaction.editReply({
            embeds: [embeds.blacklist(bot.config.embedsColor, validBlackist)],
            allowedMentions: { repliedUser: false }
        });
    }


    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(interaction.guild?.id),
        voiceChannelId: String(channel?.id),
        textChannelId: interaction.channel?.id,
        selfDeaf: true
    });

    if (!player.setting) {
        player.setting = {
            queuePage: null,
            volume: null
        };
    }

    const curVolume = player.setting.volume ?? bot.config.defaultVolume;

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = interaction;
        player.filters.setVolume(curVolume);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
        return interaction.editReply({ content: `❌ | I can't join voice channel.`, allowedMentions: { repliedUser: false } });
    }

    try {
        // Intial dashboard
        if (!player.dashboard) await dashboard.initial(bot, interaction, player);
    } catch (error) {
        await dashboard.destroy(bot, player, bot.config.embedsColor);
    }


    if (res.loadType === LoadType.PLAYLIST) {
        player.addTracks(res.tracks, interaction.user);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await interaction.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return player.destroy();
                });
        }

        return interaction.editReply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else if (res.tracks.length === 1) {
        const track = res.tracks[0];
        player.addTracks(track, interaction.user);

        if (!player.playing) {
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await interaction.reply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                    return player.destroy();
                });

            player.filters.setVolume(bot.config.defaultVolume);
        }

        return interaction.editReply({ content: "✅ | Music added.", allowedMentions: { repliedUser: false } });
    }
    else {
        const select = new StringSelectMenuBuilder()
            .setCustomId("musicSelect")
            .setPlaceholder("Select the music")
            .setOptions(res.tracks.map(x => {
                return {
                    label: x.title.length >= 25 ? x.title.substring(0, 22) + "..." : x.title,
                    description: `Duration: ${x.duration.label}`,
                    value: x.uri
                };
            }));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await interaction.editReply({ components: [row.toJSON()] });

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
                        bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                        await interaction.editReply({ content: `❌ | The service is experiencing some problems, please try again.`, allowedMentions: { repliedUser: false } });
                        return player.destroy();
                    });

                player.filters.setVolume(bot.config.defaultVolume);
            }

            i.deferUpdate();
            await msg.edit({ content: "✅ | Music added.", components: [], allowedMentions: { repliedUser: false } });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                if (!player.playing) player.destroy();
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
};