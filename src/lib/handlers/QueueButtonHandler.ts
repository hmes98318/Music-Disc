import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';
import { embeds } from '../../embeds/index.js';

import type { Client, ButtonInteraction } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for queue-related button interactions
 */
export class QueueButtonHandler {
    private static readonly QUEUE_PAGE_SIZE = 10;
    private static readonly LOOP_MODES = ['Off', 'Single', 'All'];

    /**
     * Handle queue previous page button
     */
    public static async handlePreviousPage(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        if (player.setting.queuePage.curPage <= 1) {
            player.setting.queuePage.curPage = 1;
        } else {
            player.setting.queuePage.curPage--;
        }

        await this.updateQueueDisplay(bot, client, player);
        await interaction.deferUpdate();
    }

    /**
     * Handle queue next page button
     */
    public static async handleNextPage(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        if (player.setting.queuePage.curPage >= player.setting.queuePage.maxPage) {
            player.setting.queuePage.curPage = player.setting.queuePage.maxPage;
        } else {
            player.setting.queuePage.curPage++;
        }

        await this.updateQueueDisplay(bot, client, player);
        await interaction.deferUpdate();
    }

    /**
     * Handle queue delete message button
     */
    public static async handleDelete(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (player.setting.queuePage?.msg) {
            await player.setting.queuePage.msg.delete().catch(() => { });
            player.setting.queuePage = null;
        }

        await interaction.deferUpdate();
    }

    /**
     * Handle queue clear button
     */
    public static async handleClear(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        player.queue.clear();

        if (player.setting.queuePage) {
            player.setting.queuePage.curPage = 1;
            player.setting.queuePage.maxPage = 1;
        }

        await this.updateQueueDisplay(bot, client, player);

        await interaction.deferUpdate();
    }

    /**
     * Update queue display embed
     * @private
     */
    private static async updateQueueDisplay(
        bot: Bot,
        client: Client,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        const page = player.setting.queuePage.curPage;
        const startIdx = (page - 1) * this.QUEUE_PAGE_SIZE;
        const endIdx = page * this.QUEUE_PAGE_SIZE;

        const nowplaying = client.i18n.t('events:MESSAGE_NOW_PLAYING_TITLE', {
            title: player.current?.title
        });

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

        const repeatMode = player.repeatMode;
        const row = ButtonsBuilder.createQueueButtons();

        await player.setting.queuePage.msg?.edit({
            embeds: [embeds.queue(bot, nowplaying, tracksQueue, this.LOOP_MODES[repeatMode])],
            components: [row],
            allowedMentions: { repliedUser: false }
        });
    }
}
