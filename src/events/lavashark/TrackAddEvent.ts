import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { embeds } from '../../embeds/index.js';

import type { Client, Message } from 'discord.js';
import type { Player, Track } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackAdd event handler
 * Handles notification when tracks are added to queue
 */
export class TrackAddEvent extends BaseLavaSharkEvent<'trackAdd'> {
    public getEventName(): 'trackAdd' {
        return 'trackAdd';
    }

    public async execute(bot: Bot, client: Client, player: Player, tracks: Track | Track[]): Promise<void> {
        if (!player.playing) return;

        // PLAYLIST_LOADED
        if (Array.isArray(tracks)) {
            await this.#handlePlaylistAdd(bot, client, player, tracks);
        }
        // TRACK_LOADED
        else {
            await this.#handleTrackAdd(bot, client, player, tracks);
        }

        // Refresh dashboard
        try {
            if (player.dashboardMsg) await player.dashboardMsg.delete();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Dashboard delete error:' + error);
        }

        await client.dashboard.initialize((player.metadata as Message), player);
        await client.dashboard.update(player, player.current!);
    }

    /**
     * Handle playlist addition
     * @private
     */
    async #handlePlaylistAdd(bot: Bot, _client: Client, player: Player, playlist: Track[]): Promise<void> {
        const firstTrack = playlist[0];

        if (!firstTrack) return;

        const subtitle = `Author : **${firstTrack.author}**\nDuration **${firstTrack.duration.label}**\n`;

        await (player.metadata?.channel as any).send({
            embeds: [embeds.addPlaylist(bot, firstTrack.title, subtitle, firstTrack.uri, firstTrack.thumbnail!)]
        });
    }

    /**
     * Handle single track addition
     * @private
     */
    async #handleTrackAdd(bot: Bot, client: Client, player: Player, track: Track): Promise<void> {
        const subtitle = `Author : **${track.author}**\nDuration **${track.duration.label}**\n`;

        await (player.metadata?.channel as any).send({
            embeds: [embeds.addTrack(bot, track.title, subtitle, track.uri, track.thumbnail!)]
        });
    }
}
