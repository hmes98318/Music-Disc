import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    escapeMarkdown,
} from 'discord.js';

import { PlaylistButtonId } from '../@types/index.js';
import { cst } from '../utils/constants.js';

import type { HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';
import type { PlaylistTrack } from '../lib/PlaylistManager.js';


export interface PlaylistSummary {
    name: string;
    trackCount: number;
    createdAt: number;
}

export type PlaylistOverwriteAction = 'import' | 'save';

const PLAYLIST_INFO_PAGE_SIZE = 10;
const MAX_TRACK_TITLE_LENGTH = 250;

const getColor = (
    bot: Bot,
    color: keyof Bot['config']['bot']['embedsColors'],
): HexColorString | number => {
    return bot.config.bot.embedsColors[color] as HexColorString | number;
};

const sanitizeTrackTitle = (title: string): string => {
    const shortenedTitle = title.length > MAX_TRACK_TITLE_LENGTH
        ? `${title.slice(0, MAX_TRACK_TITLE_LENGTH - 1)}…`
        : title;
    return escapeMarkdown(shortenedTitle);
};

const sanitizeTrackUrl = (url: string): string => {
    return url.replaceAll(')', '%29');
};

const playlistList = (
    bot: Bot,
    playlists: PlaylistSummary[],
    lng?: string,
): EmbedBuilder => {
    const description = playlists
        .map((playlist, index) => {
            const createdAt = Math.floor(playlist.createdAt / 1000);
            const name = escapeMarkdown(playlist.name);
            return `**${index + 1}.** \`${name}\` (${playlist.trackCount}) - <t:${createdAt}:R>`;
        })
        .join('\n');

    return new EmbedBuilder()
        .setColor(getColor(bot, 'message'))
        .setTitle(bot.i18n.t('commands:MESSAGE_PLAYLIST_LIST_TITLE', { lng }))
        .setDescription(description)
        .setTimestamp();
};

const playlistInfo = (
    bot: Bot,
    name: string,
    tracks: PlaylistTrack[],
    page: number,
    lng?: string,
): EmbedBuilder => {
    const totalPages = Math.ceil(tracks.length / PLAYLIST_INFO_PAGE_SIZE);
    const start = (page - 1) * PLAYLIST_INFO_PAGE_SIZE;
    const pageTracks = tracks.slice(start, start + PLAYLIST_INFO_PAGE_SIZE);
    const description = pageTracks
        .map((track, index) => {
            const title = sanitizeTrackTitle(track.title);
            const url = sanitizeTrackUrl(track.url);
            return `**${start + index + 1}.** [${title}](${url})`;
        })
        .join('\n');

    return new EmbedBuilder()
        .setColor(getColor(bot, 'message'))
        .setTitle(bot.i18n.t('commands:MESSAGE_PLAYLIST_INFO_TITLE', {
            count: tracks.length,
            name,
            lng,
        }))
        .setDescription(description)
        .setFooter({
            text: bot.i18n.t('commands:MESSAGE_FOOTER_PAGE', {
                page,
                totalPages,
                lng,
            }),
        })
        .setTimestamp();
};

const playlistInfoButtons = (
    page: number,
    totalPages: number,
    disabled = false,
): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(PlaylistButtonId.InfoPrevious)
            .setEmoji(cst.button.emoji.prev)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page <= 1),
        new ButtonBuilder()
            .setCustomId(PlaylistButtonId.InfoNext)
            .setEmoji(cst.button.emoji.next)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page >= totalPages),
    );
};

const playlistLoadProgress = (
    bot: Bot,
    name: string,
    count: number,
    lng?: string,
): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(getColor(bot, 'message'))
        .setDescription(bot.i18n.t('commands:MESSAGE_PLAYLIST_LOAD_START', {
            count,
            name,
            lng,
        }));
};

const playlistLoadResult = (
    bot: Bot,
    name: string,
    added: number,
    skipped: number,
    lng?: string,
): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(getColor(bot, skipped > 0 ? 'warning' : 'success'))
        .setDescription(bot.i18n.t('commands:MESSAGE_PLAYLIST_LOAD_COMPLETE', {
            added,
            name,
            skipped,
            lng,
        }));
};

const playlistOverwrite = (
    bot: Bot,
    action: PlaylistOverwriteAction,
    name: string,
    trackCount: number,
    lng?: string,
): EmbedBuilder => {
    const descriptionKey = action === 'save'
        ? 'commands:MESSAGE_PLAYLIST_SAVE_EXISTS_DESCRIPTION'
        : 'commands:MESSAGE_PLAYLIST_EXISTS_DESCRIPTION';

    return new EmbedBuilder()
        .setColor(getColor(bot, 'warning'))
        .setTitle(bot.i18n.t('commands:MESSAGE_PLAYLIST_EXISTS_TITLE', { lng }))
        .setDescription(bot.i18n.t(descriptionKey, {
            count: trackCount,
            name,
            lng,
        }))
        .setTimestamp();
};

const playlistOverwriteButtons = (
    bot: Bot,
    action: PlaylistOverwriteAction,
    lng?: string,
): ActionRowBuilder<ButtonBuilder> => {
    const confirmId = action === 'save'
        ? PlaylistButtonId.SaveConfirm
        : PlaylistButtonId.ImportConfirm;
    const cancelId = action === 'save'
        ? PlaylistButtonId.SaveCancel
        : PlaylistButtonId.ImportCancel;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel(bot.i18n.t('commands:LABEL_OVERWRITE', { lng }))
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel(bot.i18n.t('commands:LABEL_CANCEL', { lng }))
            .setStyle(ButtonStyle.Secondary),
    );
};

export {
    PLAYLIST_INFO_PAGE_SIZE,
    playlistInfo,
    playlistInfoButtons,
    playlistList,
    playlistLoadProgress,
    playlistLoadResult,
    playlistOverwrite,
    playlistOverwriteButtons,
};
