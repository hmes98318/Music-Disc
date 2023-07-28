import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { embeds } from "../embeds";


export const name = 'queue';
export const aliases = ['q', 'list'];
export const description = 'Show currnet playlist';
export const usage = 'queue';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    let nowplaying = `Now Playing : ${player.current?.title}\n\n`;
    let tracksQueue = '';
    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\`` });

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

    return message.reply({
        embeds: [embeds.queue(client.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
        allowedMentions: { repliedUser: false }
    });
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    let nowplaying = `Now Playing : ${player.current?.title}\n\n`;
    let tracksQueue = '';
    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\`` });

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

    return interaction.editReply({
        embeds: [embeds.queue(client.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
        allowedMentions: { repliedUser: false }
    });
}