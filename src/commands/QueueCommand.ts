import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { ButtonsBuilder } from '../lib/builders/ButtonsBuilder.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class QueueCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'queue',
            aliases: ['q', 'list'],
            description: i18next.t('commands:CONFIG_QUEUE_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_QUEUE_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Delete old queue page if exists
        if (player.setting.queuePage && player.setting.queuePage.msg) {
            try {
                await player.setting.queuePage.msg.delete();
            } catch (_) { }
        }

        // Initialize queue page
        player.setting.queuePage = {
            maxPage: Math.ceil(player.queue.tracks.length / 10),
            curPage: 1,
            msg: null
        };

        const page = player.setting.queuePage.curPage;
        const startIdx = (page - 1) * 10;
        const endIdx = page * 10;

        const requesterName = player.current?.requester?.username || client.i18n.t('commands:UNKNOWN_USER');
        const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE_WITH_REQUESTER', {
            title: player.current?.title,
            requester: requesterName
        });

        const queueTracks = player.queue.tracks.slice(startIdx, endIdx);
        const tracksQueue = this.#buildTracksQueue(client, queueTracks, startIdx, page, player.setting.queuePage.maxPage, player.queue.tracks.length);

        const methods = ['OFF', 'SINGLE', 'ALL'];
        const repeatMode = player.repeatMode;
        const row = ButtonsBuilder.createQueueButtons();

        player.setting.queuePage.msg = await context.reply({
            embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
            components: [row],
            allowedMentions: { repliedUser: false },
        });

        if (context.isMessage()) {
            await context.react('👍');
        }
    }

    /**
     * Build tracks queue string with auto-shortening for Discord's limit
     * @private
     */
    #buildTracksQueue(
        client: Client,
        queueTracks: any[],
        startIdx: number,
        curPage: number,
        maxPage: number,
        totalTracks: number
    ): string {
        let maxTitleLength = 100;

        const buildTrackList = (titleLength: number) => {
            return queueTracks.map((track, index) => {
                let title = track.title;
                if (title.length > titleLength) {
                    title = title.substring(0, titleLength) + '...';
                }
                const requesterName = track.requester?.username || client.i18n.t('commands:UNKNOWN_USER');
                return `${startIdx + index + 1}. [${title}](${track.uri}) - \`${track.duration.label}\` | ${requesterName}`;
            });
        };

        let tracks = buildTrackList(maxTitleLength);
        let tracksQueue = '';

        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length === totalTracks) {
            tracksQueue = tracks.join('\n');
        }
        else {
            tracksQueue = tracks.join('\n') +
                `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage, maxPage })}`;
        }

        // Check if exceeds Discord's 1024 character limit and shorten if needed
        while (tracksQueue.length > 1024 && maxTitleLength > 10) {
            maxTitleLength -= 10;
            tracks = buildTrackList(maxTitleLength);

            if (tracks.length === totalTracks) {
                tracksQueue = tracks.join('\n');
            }
            else {
                tracksQueue = tracks.join('\n') +
                    `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage, maxPage })}`;
            }
        }

        // Final fallback: if still too long, truncate the string
        if (tracksQueue.length > 1024) {
            tracksQueue = tracksQueue.substring(0, 1021) + '...';
        }

        return tracksQueue;
    }
}
