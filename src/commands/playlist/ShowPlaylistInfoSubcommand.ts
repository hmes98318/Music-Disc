import { ComponentType, MessageFlags } from 'discord.js';

import { PlaylistButtonId } from '../../@types/index.js';
import { embeds } from '../../embeds/index.js';
import { PLAYLIST_INFO_PAGE_SIZE } from '../../embeds/playlist.embed.js';
import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';
import { ListPlaylistsSubcommand } from './ListPlaylistsSubcommand.js';

import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';


const PAGINATION_TIMEOUT_MS = 120_000;

/**
 * Display the tracks stored in a playlist with button pagination
 */
export class ShowPlaylistInfoSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'info';

    /**
     * Load playlist tracks and manage the paginated information message
     */
    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        const name = this.getPlaylistName(context.command);
        if (!name) {
            await new ListPlaylistsSubcommand().execute(context);
            return;
        }

        const playlist = context.playlistManager.getPlaylist(
            context.command.guild!.id,
            name,
        );
        const tracks = playlist?.tracks;
        if (!tracks?.length) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }),
            );
            return;
        }

        // Send navigation controls only when the playlist spans multiple pages
        const totalPages = Math.ceil(tracks.length / PLAYLIST_INFO_PAGE_SIZE);
        let currentPage = 1;
        const message = await context.command.reply({
            embeds: [embeds.playlistInfo(
                context.bot,
                name,
                tracks,
                currentPage,
                context.command.language,
            )],
            components: totalPages > 1
                ? [embeds.playlistInfoButtons(currentPage, totalPages)]
                : [],
        });
        if (totalPages <= 1) return;

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: PAGINATION_TIMEOUT_MS,
        });

        collector.on('collect', async (interaction) => {
            // Restrict pagination controls to the command user
            if (interaction.user.id !== context.command.user.id) {
                await interaction.reply({
                    content: context.command.t(
                        'commands:ERROR_ONLY_COMMAND_USER_PAGINATE',
                    ),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (interaction.customId === PlaylistButtonId.InfoPrevious) {
                currentPage = Math.max(1, currentPage - 1);
            } else if (interaction.customId === PlaylistButtonId.InfoNext) {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else {
                return;
            }

            await interaction.update({
                embeds: [embeds.playlistInfo(
                    context.bot,
                    name,
                    tracks,
                    currentPage,
                    context.command.language,
                )],
                components: [embeds.playlistInfoButtons(currentPage, totalPages)],
            });
        });

        collector.on('end', async () => {
            // Keep the final page visible while disabling expired controls
            try {
                await message.edit({
                    components: [embeds.playlistInfoButtons(
                        currentPage,
                        totalPages,
                        true,
                    )],
                });
            } catch (error) {
                context.bot.logger.error(
                    context.bot.shardId,
                    `[PlaylistCommand] Failed to disable pagination: ${error}`,
                );
            }
        });
    }
}
