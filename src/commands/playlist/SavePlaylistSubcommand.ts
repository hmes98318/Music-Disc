import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';
import { PLAYLIST_TRACK_LIMIT } from '../../lib/PlaylistManager.js';

import type { Player } from 'lavashark';
import type { PlaylistTrack } from '../../lib/PlaylistManager.js';
import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';


type QueueTrack = Player['queue']['tracks'][number];
type SavedPlaylistTrack = Omit<PlaylistTrack, 'position'>;

/**
 * Save the current track and queue as a guild playlist
 */
export class SavePlaylistSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'save';

    /**
     * Serialize the active queue and persist it under the requested name
     */
    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        const guildId = context.command.guild!.id;
        const player = context.client.lavashark.getPlayer(guildId);
        if (!player?.current) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NO_PLAYING'),
            );
            return;
        }

        const name = this.getPlaylistName(context.command);
        if (!name) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'),
            );
            return;
        }

        // Preserve playback order by storing the current track before the queue
        const tracks: SavedPlaylistTrack[] = [
            this.serializeTrack(player.current),
            ...player.queue.tracks.map((track) => this.serializeTrack(track)),
        ];
        if (tracks.length > PLAYLIST_TRACK_LIMIT) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_TRACK_LIMIT', {
                    limit: PLAYLIST_TRACK_LIMIT,
                }),
            );
            return;
        }

        // Require explicit confirmation before replacing stored data
        const existingPlaylist = context.playlistManager.getPlaylist(
            guildId,
            name,
        );
        if (existingPlaylist) {
            const confirmed = await this.confirmOverwrite(
                context,
                'save',
                name,
                existingPlaylist.tracks?.length ?? 0,
            );
            if (!confirmed) return;
        }

        const saved = context.playlistManager.saveCurrentQueue(
            guildId,
            name,
            tracks,
        );
        if (!saved) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_SAVE_FAILED'),
            );
            return;
        }

        await context.command.replySuccess(
            context.bot,
            context.command.t('commands:MESSAGE_PLAYLIST_SAVE_SUCCESS', {
                count: tracks.length,
                name,
            }),
        );
    }

    /**
     * Convert a LavaShark queue track into the playlist storage shape
     */
    private serializeTrack(track: QueueTrack): SavedPlaylistTrack {
        return {
            author: track.author || null,
            duration: track.duration.value,
            encoded: 'encoded' in track ? track.encoded : null,
            title: track.title,
            url: track.uri,
        };
    }
}
