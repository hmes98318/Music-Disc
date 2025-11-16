import {
    ChatInputCommandInteraction,
    Client,
    Message
} from 'discord.js';
import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { ButtonsBuilder } from '../lib/builders/ButtonsBuilder.js';
import { CommandCategory } from '../@types/index.js';

import type { Bot } from '../@types/index.js';


export const name = 'queue';
export const aliases = ['q', 'list'];
export const description = i18next.t('commands:CONFIG_QUEUE_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_QUEUE_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    if (player.setting.queuePage) {
        try {
            await player.setting.queuePage.msg?.delete();
        } catch (_) { }
    }

    player.setting.queuePage = {
        maxPage: Math.ceil(player.queue.tracks.length / 10),
        curPage: 1,
        msg: null
    };

    const page = player.setting.queuePage.curPage;
    const startIdx = (page - 1) * 10;
    const endIdx = page * 10;

    const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
    let tracksQueue = '';
    const queueTracks = player.queue.tracks.slice(startIdx, endIdx);

    // Build track list with length check
    let maxTitleLength = 100;   // Initial max title length
    const buildTrackList = (titleLength: number) => {
        return queueTracks.map((track, index) => {
            let title = track.title;
            if (title.length > titleLength) {
                title = title.substring(0, titleLength) + '...';
            }
            return `${startIdx + index + 1}. [${title}](${track.uri}) - \`${track.duration.label}\``;
        });
    };

    let tracks = buildTrackList(maxTitleLength);

    if (tracks.length < 1) {
        tracksQueue = '------------------------------';
    }
    else if (tracks.length === player.queue.tracks.length) {
        tracksQueue = tracks.join('\n');
    }
    else {
        tracksQueue = tracks.join('\n') +
            `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage })}`;
    }

    // Check if exceeds Discord's 1024 character limit and shorten if needed
    while (tracksQueue.length > 1024 && maxTitleLength > 10) {
        maxTitleLength -= 10;
        tracks = buildTrackList(maxTitleLength);

        if (tracks.length === player.queue.tracks.length) {
            tracksQueue = tracks.join('\n');
        }
        else {
            tracksQueue = tracks.join('\n') +
                `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage })}`;
        }
    }

    // Final fallback: if still too long, truncate the string
    if (tracksQueue.length > 1024) {
        tracksQueue = tracksQueue.substring(0, 1021) + '...';
    }


    const methods = ['OFF', 'SINGLE', 'ALL'];
    const repeatMode = player.repeatMode;

    const row = ButtonsBuilder.createQueueButtons();

    player.setting.queuePage.msg = await message.reply({
        embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
        components: [row],
        allowedMentions: { repliedUser: false },
    });

    return message.react('👍');
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    if (player.setting.queuePage) {
        try {
            await player.setting.queuePage.msg?.delete();
        } catch (_) { }
    }

    player.setting.queuePage = {
        maxPage: Math.ceil(player.queue.tracks.length / 10),
        curPage: 1,
        msg: null
    };

    const page = player.setting.queuePage.curPage;
    const startIdx = (page - 1) * 10;
    const endIdx = page * 10;

    const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
    let tracksQueue = '';
    const queueTracks = player.queue.tracks.slice(startIdx, endIdx);

    // Build track list with length check
    let maxTitleLength = 100;   // Initial max title length
    const buildTrackList = (titleLength: number) => {
        return queueTracks.map((track, index) => {
            let title = track.title;
            if (title.length > titleLength) {
                title = title.substring(0, titleLength) + '...';
            }
            return `${startIdx + index + 1}. [${title}](${track.uri}) - \`${track.duration.label}\``;
        });
    };

    let tracks = buildTrackList(maxTitleLength);

    if (tracks.length < 1) {
        tracksQueue = '------------------------------';
    }
    else if (tracks.length === player.queue.tracks.length) {
        tracksQueue = tracks.join('\n');
    }
    else {
        tracksQueue = tracks.join('\n') +
            `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage })}`;
    }

    // Check if exceeds Discord's 1024 character limit and shorten if needed
    while (tracksQueue.length > 1024 && maxTitleLength > 10) {
        maxTitleLength -= 10;
        tracks = buildTrackList(maxTitleLength);

        if (tracks.length === player.queue.tracks.length) {
            tracksQueue = tracks.join('\n');
        }
        else {
            tracksQueue = tracks.join('\n') +
                `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage })}`;
        }
    }

    // Final fallback: if still too long, truncate the string
    if (tracksQueue.length > 1024) {
        tracksQueue = tracksQueue.substring(0, 1021) + '...';
    }


    const methods = ['OFF', 'SINGLE', 'ALL'];
    const repeatMode = player.repeatMode;

    const row = ButtonsBuilder.createQueueButtons();

    player.setting.queuePage.msg = await interaction.editReply({
        embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
        components: [row],
        allowedMentions: { repliedUser: false },
    });
};