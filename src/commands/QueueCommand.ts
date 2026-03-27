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
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Delete old queue page if exists
        if (player.setting.queuePage && player.setting.queuePage.msg) {
            try {
                await player.setting.queuePage.msg.delete();
            } catch (_) { }
        }

        // Initialize queue page (5 songs per page)
        player.setting.queuePage = {
            maxPage: Math.max(1, Math.ceil(player.queue.tracks.length / 5)),
            curPage: 1,
            msg: null
        };

        const page = player.setting.queuePage.curPage;
        const startIdx = (page - 1) * 5;
        const endIdx = page * 5;

        const queueTracks = player.queue.tracks.slice(startIdx, endIdx);
        const description = this.#buildQueueDescription(client, player, queueTracks, startIdx, page, player.setting.queuePage.maxPage, player.queue.tracks.length);

        const methods = [
            client.i18n.t('commands:REPEAT_MODE_OFF'),
            client.i18n.t('commands:REPEAT_MODE_SINGLE'),
            client.i18n.t('commands:REPEAT_MODE_ALL')
        ];
        const repeatMode = player.repeatMode;
        const row = ButtonsBuilder.createQueueButtons();

        player.setting.queuePage.msg = await context.reply({
            embeds: [embeds.queue(bot, description, methods[repeatMode])],
            components: [row],
            allowedMentions: { repliedUser: false },
        });

        if (context.isMessage()) {
            await context.react('👍');
        }
    }

    /**
     * Build queue description with now playing + queue entries
     * @private
     */
    #buildQueueDescription(
        client: Client,
        player: any,
        queueTracks: any[],
        startIdx: number,
        curPage: number,
        maxPage: number,
        totalTracks: number
    ): string {
        let maxTitleLength = 80;

        const buildDescription = (titleLength: number): string => {
            const nowPlayingTitle = player.current?.title || 'Unknown';
            const truncatedNP = nowPlayingTitle.length > titleLength
                ? nowPlayingTitle.substring(0, titleLength) + '...'
                : nowPlayingTitle;

            let desc = `**Now Playing:**\n${truncatedNP}\n${'─'.repeat(20)}\n`;

            if (queueTracks.length < 1) {
                desc += '\n*No songs in queue*';
            } else {
                desc += '\n**Queue:**\n';
                const entries = queueTracks.map((track: any, index: number) => {
                    let title = track.title;
                    if (title.length > titleLength) {
                        title = title.substring(0, titleLength) + '...';
                    }
                    const requesterId = track.requester?.id;
                    const requesterMention = requesterId ? `<@${requesterId}>` : (track.requester?.username || client.i18n.t('commands:UNKNOWN_USER'));
                    return `${startIdx + index + 1}. ${title} **${track.duration.label}** | ${requesterMention}`;
                });
                desc += entries.join('\n');
            }

            if (totalTracks > 0 && maxPage > 1) {
                desc += `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage, maxPage })}`;
            }

            return desc;
        };

        let description = buildDescription(maxTitleLength);

        // Shorten if exceeds Discord's description limit
        while (description.length > 4000 && maxTitleLength > 10) {
            maxTitleLength -= 10;
            description = buildDescription(maxTitleLength);
        }

        if (description.length > 4096) {
            description = description.substring(0, 4093) + '...';
        }

        return description;
    }
}
