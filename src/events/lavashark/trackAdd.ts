import { dashboard } from "../../dashboard";
import { embeds } from "../../embeds";

import type { Client, Message } from "discord.js";
import type { Player, Track } from "lavashark";
import type { Bot } from "../../@types";


export default async (bot: Bot, _client: Client, player: Player, tracks: Track | Track[]) => {
    if (player.playing) {
        if (Array.isArray(tracks)) { // PLAYLIST_LOADED
            const playlist = tracks as unknown as Track[];
            const subtitle = `Author : **${playlist[0]?.author}**\nDuration **${playlist[0]?.duration.label}**\n`;

            await player.metadata?.channel?.send({ embeds: [embeds.addPlaylist(bot.config.embedsColor, playlist[0].title, subtitle, playlist[0].uri, playlist[0].thumbnail!)] });
        }
        else {
            const track = tracks as Track;
            const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

            await player.metadata?.channel?.send({ embeds: [embeds.addTrack(bot.config.embedsColor, track.title, subtitle, track.uri, track.thumbnail!)] });
        }

        try {
            await player.dashboard?.delete();
        } catch (error) {
            bot.logger.emit('error', 'Dashboard delete error:', error);
        }

        await dashboard.initial(bot, (player.metadata as Message), player);
        await dashboard.update(bot, player, player.current!);
    }
};