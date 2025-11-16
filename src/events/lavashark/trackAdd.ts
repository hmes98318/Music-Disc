import { embeds } from '../../embeds/index.js';

import type { Client, Message } from 'discord.js';
import type { Player, Track } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client, player: Player, tracks: Track | Track[]) => {
    if (player.playing) {
        if (Array.isArray(tracks)) { // PLAYLIST_LOADED
            const playlist = tracks as unknown as Track[];
            const subtitle = `Author : **${playlist[0]?.author}**\nDuration **${playlist[0]?.duration.label}**\n`;

            await (player.metadata?.channel as any /* discord.js type error ? (v14.16.2) */).send({ embeds: [embeds.addPlaylist(bot, playlist[0].title, subtitle, playlist[0].uri, playlist[0].thumbnail!)] });
        }
        else {
            const track = tracks as Track;
            const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

            await (player.metadata?.channel as any /* discord.js type error ? (v14.16.2) */).send({ embeds: [embeds.addTrack(bot, track.title, subtitle, track.uri, track.thumbnail!)] });
        }

        try {
            await player.dashboardMsg?.delete();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Dashboard delete error:' + error);
        }

        await client.dashboard.initialize((player.metadata as Message), player);
        await client.dashboard.update(player, player.current!);
    }
};