import { embeds } from '../../embeds/index.js';
import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';

import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';


/**
 * Display all playlists stored for the current guild
 */
export class ListPlaylistsSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'list';

    /**
     * Load playlist summaries and reply with the playlist list embed
     */
    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        const playlists = context.playlistManager.getPlaylists(
            context.command.guild!.id,
        );
        if (playlists.length === 0) {
            await context.command.replySuccess(
                context.bot,
                context.command.t('commands:MESSAGE_PLAYLIST_LIST_EMPTY'),
            );
            return;
        }

        await context.command.reply({
            embeds: [embeds.playlistList(
                context.bot,
                playlists,
                context.command.language,
            )],
        });
    }
}
