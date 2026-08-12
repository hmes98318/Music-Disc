import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';
import { PLAYLIST_TRACK_LIMIT } from '../../lib/PlaylistManager.js';
import {
    DEFAULT_REMOTE_TEXT_MAX_BYTES,
    DEFAULT_REMOTE_TEXT_TIMEOUT_MS,
    fetchSafeRemoteText,
    SafeRemoteTextError,
} from '../../utils/safeRemoteText.js';

import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';


/**
 * Import a remote M3U file as a guild playlist
 */
export class ImportPlaylistSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'import';

    /**
     * Validate import arguments and confirm replacement when required
     */
    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        if (!context.bot.config.playlist?.allowM3uImport) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_M3U_DISABLED'),
            );
            return;
        }

        const args = this.getImportArguments(context.command);
        if (!args) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'),
            );
            return;
        }

        // Avoid replacing existing playlist data without user confirmation
        const existingPlaylist = context.playlistManager.getPlaylist(
            context.command.guild!.id,
            args.name,
        );
        if (existingPlaylist) {
            const confirmed = await this.confirmOverwrite(
                context,
                'import',
                args.name,
                existingPlaylist.tracks?.length ?? 0,
            );
            if (!confirmed) return;
        }

        await this.import(context, args.name, args.url);
    }

    /**
     * Download, parse, and persist the remote playlist
     */
    private async import(
        context: PlaylistSubcommandContext,
        name: string,
        url: string,
    ): Promise<void> {
        try {
            // Apply remote text security limits before parsing M3U content
            const m3uContent = await fetchSafeRemoteText(url);
            const result = context.playlistManager.importFromM3u(
                context.command.guild!.id,
                name,
                m3uContent,
            );

            if (result.success) {
                await context.command.replySuccess(
                    context.bot,
                    context.command.t('commands:MESSAGE_PLAYLIST_IMPORT_SUCCESS', {
                        count: result.trackCount,
                        name,
                    }),
                );
                return;
            }

            if (result.reason === 'TRACK_LIMIT') {
                await context.command.replyEphemeralError(
                    context.bot,
                    context.command.t('commands:ERROR_PLAYLIST_TRACK_LIMIT', {
                        limit: PLAYLIST_TRACK_LIMIT,
                    }),
                );
                return;
            }

            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_IMPORT_FAILED'),
            );
        } catch (error) {
            await this.handleImportError(context, error);
        }
    }

    /**
     * Map remote download and import failures to localized responses
     */
    private async handleImportError(
        context: PlaylistSubcommandContext,
        error: unknown,
    ): Promise<void> {
        context.bot.logger.error(
            context.bot.shardId,
            `[PlaylistCommand] Error importing playlist from remote URL: ${error}`,
        );

        if (error instanceof SafeRemoteTextError &&
            error.code === 'HTTP_STATUS' && error.status !== undefined) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t(
                    'commands:ERROR_PLAYLIST_M3U_DOWNLOAD_FAILED',
                    { status: error.status },
                ),
            );
            return;
        }

        if (error instanceof SafeRemoteTextError) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t(
                    'commands:ERROR_PLAYLIST_M3U_DOWNLOAD_BLOCKED',
                    {
                        maxSizeMiB: DEFAULT_REMOTE_TEXT_MAX_BYTES / (1024 * 1024),
                        timeoutSeconds: DEFAULT_REMOTE_TEXT_TIMEOUT_MS / 1000,
                    },
                ),
            );
            return;
        }

        await context.command.replyEphemeralError(
            context.bot,
            context.command.t('commands:ERROR_PLAYLIST_IMPORT_FAILED'),
        );
    }
}
