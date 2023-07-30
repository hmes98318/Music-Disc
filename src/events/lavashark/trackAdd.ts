import { Client, Message } from "discord.js";
import { Player, Track } from "lavashark";

import { dashboard } from "../../dashboard";
import { embeds } from "../../embeds";


export default async (client: Client, player: Player, tracks: Track | Track[]) => {
    if (player.playing) {
        if (Array.isArray(tracks)) { // PLAYLIST_LOADED
            const playlist = tracks as unknown as Track[];
            const subtitle = `Author : **${playlist[0]?.author}**\nDuration **${playlist[0]?.duration.label}**\n`;

            await player.metadata?.channel?.send({ embeds: [embeds.addPlaylist(client.config.embedsColor, playlist[0].title, subtitle, playlist[0].uri, playlist[0].thumbnail!)] })
        }
        else {
            const track = tracks as Track;
            const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

            await player.metadata?.channel?.send({ embeds: [embeds.addTrack(client.config.embedsColor, track.title, subtitle, track.uri, track.thumbnail!)] })
        }

        try {
            await player.dashboard?.delete();
        } catch (error) {
            console.log('Dashboard delete error:', error);
        }

        await dashboard.initial(client, (player.metadata as Message), player);
        await dashboard.update(client, player, player.current!);
    }
};