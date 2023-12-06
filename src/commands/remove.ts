import { embeds } from "../embeds";

import type {
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message
} from "discord.js";
import type { Bot } from "../@types";


export const name = 'remove';
export const aliases = ['rm'];
export const description = 'Select a song to remove from the playlist';
export const usage = 'remove <track index number> [from index to index 2 track]';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "index",
        description: "track index number",
        type: 10,
        required: false
    },
    {
        name: "index2",
        description: "from index to index 2 track",
        type: 10,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\``; });

    if (tracks.length < 1) {
        return message.reply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });
    }

    let SUCCESS = false;

    if (args.length === 1) { // +rm 1
        const index = parseInt(args[0]);
        SUCCESS = player.queue.remove(index - 1);

        if (!SUCCESS) {
            return message.react('❌');
        }
        else {
            await message.react('👍');
            return message.reply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (args.length === 2) { // +rm 3 4
        const index1 = parseInt(args[0]),
            index2 = parseInt(args[1]);
        SUCCESS = player.queue.remove(index1 - 1, index2 - index1 + 1);

        if (!SUCCESS) {
            return message.react('❌');
        }
        else {
            const musicTitle = tracks.slice(index1 - 1, index2).join('\n');
            await message.react('👍');
            return message.reply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, musicTitle)],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (args.length < 1) { // +rm
        const nowplaying = `Now Playing : ${player.current?.title}\n\n`;
        let tracksQueue = '';

        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += `\nand ${tracks.length - 10} other songs`;
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const methods = ['Off', 'Single', 'All'];
        const repeatMode = player.repeatMode;
        const instruction = `Choose a song from **1** to **${tracks.length}** to **remove** or enter others to cancel selection. ⬇️`;

        await message.react('👍');
        await message.reply({
            content: instruction,
            embeds: [embeds.removeList(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
            allowedMentions: { repliedUser: false }
        });


        const collector = message.channel.createMessageCollector({
            time: 10000, // 10s
            filter: m => m.author.id === message.author.id
        });

        collector.on('collect', async (query: Message<boolean>) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                await message.reply({ content: `✅ | Cancelled remove.`, allowedMentions: { repliedUser: false } });
                return collector.stop();
            }

            await query.react('👍');
            player.queue.remove(index - 1);

            await query.reply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });
            return collector.stop();
        });

        collector.on('end', async (_msg: Collection<string, Message<boolean>>, reason: string) => {
            if (reason === 'time') {
                await message.reply({ content: `❌ | Song remove time expired`, allowedMentions: { repliedUser: false } });
            }
        });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\``; });

    if (tracks.length < 1) {
        return interaction.editReply({ content: `❌ | No music in queue after current.`, allowedMentions: { repliedUser: false } });
    }

    const index1 = interaction.options.getNumber('index');
    const index2 = interaction.options.getNumber('index2');
    let SUCCESS = false;

    if ((index1 === null && index2 !== null) || (index1 !== null && index2 === null)) { // +rm 1
        const index = index1 || index2;
        SUCCESS = player.queue.remove(index! - 1);

        if (!SUCCESS) {
            return interaction.editReply('❌ | Music remove failed.');
        }
        else {
            return interaction.editReply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, tracks[index! - 1])],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (index1 !== null && index2 !== null) { // +rm 3 4
        SUCCESS = player.queue.remove(index1 - 1, index2 - index1 + 1);

        if (!SUCCESS) {
            return interaction.editReply('❌ | Music remove failed.');
        }
        else {
            const musicTitle = tracks.slice(index1 - 1, index2).join('\n');
            return interaction.editReply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, musicTitle)],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (index1 === null && index2 === null) { // +rm
        const nowplaying = `Now Playing : ${player.current?.title}\n\n`;
        let tracksQueue = '';

        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += `\nand ${tracks.length - 10} other songs`;
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const methods = ['Off', 'Single', 'All'];
        const repeatMode = player.repeatMode;
        const instruction = `Choose a song from **1** to **${tracks.length}** to **remove** or enter others to cancel selection. ⬇️`;

        await interaction.editReply({
            content: instruction,
            embeds: [embeds.removeList(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
            allowedMentions: { repliedUser: false }
        });


        const collector = interaction.channel!.createMessageCollector({
            time: 10000, // 10s
            filter: m => m.author.id === interaction.user.id
        });

        collector.on('collect', async (query: Message<boolean>) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                await interaction.editReply({ content: `✅ | Cancelled remove.`, allowedMentions: { repliedUser: false } });
                return collector.stop();
            }

            await query.react('👍');
            player.queue.remove(index - 1);

            await query.reply({
                embeds: [embeds.removeTrack(bot.config.embedsColor, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });
            return collector.stop();
        });

        collector.on('end', async (_msg: Collection<string, Message<boolean>>, reason: string) => {
            if (reason === 'time') {
                await interaction.editReply({ content: `❌ | Song remove time expired`, allowedMentions: { repliedUser: false } });
            }
        });
    }

};