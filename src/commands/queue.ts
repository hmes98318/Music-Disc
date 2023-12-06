import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    Message
} from "discord.js";
import { embeds } from "../embeds";
import { cst } from "../utils/constants";

import type { Bot } from "../@types";


export const name = 'queue';
export const aliases = ['q', 'list'];
export const description = 'Show currnet playlist';
export const usage = 'queue';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    if (player.queuePage) {
        try {
            await player.queuePage.msg?.delete();
        } catch (_) { }
    }

    player.queuePage = {
        maxPage: Math.ceil(player.queue.tracks.length / 10),
        curPage: 1,
        msg: null
    };

    const page = player.queuePage.curPage;
    const startIdx = (page - 1) * 10;
    const endIdx = page * 10;

    const nowplaying = `Now Playing: ${player.current?.title}\n\n`;
    let tracksQueue = '';
    const tracks = player.queue.tracks.slice(startIdx, endIdx)
        .map((track, index) => {
            return `${startIdx + index + 1}. \`${track.title}\``;
        });

    if (tracks.length < 1) {
        tracksQueue = '------------------------------';
    }
    else if (tracks.length === player.queue.tracks.length) {
        tracksQueue = tracks.join('\n');
    }
    else {
        tracksQueue = tracks.join('\n');
        tracksQueue += `\n\n----- Page ${page}/${player.queuePage.maxPage} -----`;
    }


    const methods = ['Off', 'Single', 'All'];
    const repeatMode = player.repeatMode;

    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

    player.queuePage.msg = await message.reply({
        embeds: [embeds.queue(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
        components: [row],
        allowedMentions: { repliedUser: false },
    });

    return message.react('👍');
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    if (player.queuePage) {
        try {
            await player.queuePage.msg?.delete();
        } catch (_) { }
    }

    player.queuePage = {
        maxPage: Math.ceil(player.queue.tracks.length / 10),
        curPage: 1,
        msg: null
    };

    const page = player.queuePage.curPage;
    const startIdx = (page - 1) * 10;
    const endIdx = page * 10;

    const nowplaying = `Now Playing: ${player.current?.title}\n\n`;
    let tracksQueue = '';
    const tracks = player.queue.tracks.slice(startIdx, endIdx)
        .map((track, index) => {
            return `${startIdx + index + 1}. \`${track.title}\``;
        });

    if (tracks.length < 1) {
        tracksQueue = '------------------------------';
    }
    else if (tracks.length === player.queue.tracks.length) {
        tracksQueue = tracks.join('\n');
    }
    else {
        tracksQueue = tracks.join('\n');
        tracksQueue += `\n\n----- Page ${page}/${player.queuePage.maxPage} -----`;
    }


    const methods = ['Off', 'Single', 'All'];
    const repeatMode = player.repeatMode;

    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

    player.queuePage.msg = await interaction.editReply({
        embeds: [embeds.queue(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
        components: [row],
        allowedMentions: { repliedUser: false },
    });
};