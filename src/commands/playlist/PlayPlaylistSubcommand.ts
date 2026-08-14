import { DJModeEnum, LoadType } from '../../@types/index.js';
import { embeds } from '../../embeds/index.js';
import { DJManager } from '../../lib/DjManager.js';
import { QueueLimitManager } from '../../lib/QueueLimitManager.js';
import { isUserInBlacklist } from '../../utils/functions/isUserInBlacklist.js';
import {
    decodeTracksWithRetry,
    decodeTrackWithRetry,
    searchWithRetry,
    sleep,
} from '../../utils/functions/lavasharkRequest.js';
import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';

import type { GuildMember, VoiceBasedChannel } from 'discord.js';
import type { Player } from 'lavashark';
import type { Playlist, PlaylistTrack } from '../../lib/PlaylistManager.js';
import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';


interface PlaylistLoadResult {
    added: number;
    skipped: number;
}

type PlayerRequester = Parameters<Player['addTracks']>[1];

/**
 * Load a stored playlist into the guild player and start playback
 */
export class PlayPlaylistSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'play';

    /**
     * Validate the playlist and begin the playback workflow
     */
    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        const name = this.getPlaylistName(context.command);
        if (!name) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'),
            );
            return;
        }

        const playlist = context.playlistManager.getPlaylist(
            context.command.guild!.id,
            name,
        );
        if (!playlist?.tracks?.length) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }),
            );
            return;
        }

        if (playlist.isM3u) {
            await context.command.replyEphemeralError(
                context.bot,
                context.command.t('commands:ERROR_PLAYLIST_M3U_CANNOT_PLAY_ALL'),
            );
            return;
        }

        await this.play(context, playlist);
    }

    /**
     * Coordinate player initialization, track loading, and queue persistence
     */
    private async play(
        context: PlaylistSubcommandContext,
        playlist: Playlist,
    ): Promise<void> {
        const voiceChannel = await this.getVoiceChannel(context);
        const member = context.command.member;
        if (!voiceChannel || !member) return;

        const player = await this.initializePlayer(context, voiceChannel);
        if (!player) return;

        const tracks = playlist.tracks ?? [];
        // Reuse one progress message for the final load result
        const progressMessage = await context.command.reply({
            embeds: [embeds.playlistLoadProgress(
                context.bot,
                playlist.name,
                tracks.length,
                context.command.language,
            )],
        });
        const result = await this.loadTracks(context, player, playlist, member);

        if (result.added > 0) {
            await this.startPlayback(context, player);
            if (context.bot.config.queuePersistence.enabled &&
                context.client.queuePersistence) {
                await context.client.queuePersistence.saveQueue(player);
            }
        }

        await progressMessage.edit({
            embeds: [embeds.playlistLoadResult(
                context.bot,
                playlist.name,
                result.added,
                result.skipped,
                context.command.language,
            )],
        });
    }

    /**
     * Validate voice channel restrictions and blacklist membership
     */
    private async getVoiceChannel(
        context: PlaylistSubcommandContext,
    ): Promise<VoiceBasedChannel | null> {
        const { bot, client, command } = context;
        const voiceChannel = command.member?.voice.channel;
        if (!voiceChannel) {
            await command.replyEphemeralError(
                bot,
                command.t('events:ERROR_NOT_IN_VOICE_CHANNEL'),
            );
            return null;
        }

        // Enforce the configured voice channel when one is specified
        if (bot.config.bot.specifyVoiceChannel &&
            voiceChannel.id !== bot.config.bot.specifyVoiceChannel) {
            await command.replyEphemeralError(
                bot,
                command.t('events:ERRPR_NOT_IN_SPECIFIC_VOICE_CHANNEL', {
                    channelId: bot.config.bot.specifyVoiceChannel,
                }),
            );
            return null;
        }

        // Prevent controlling a player from a different voice channel
        const guild = await client.guilds.fetch(command.guild!.id);
        const botVoiceChannelId = guild.members.me?.voice.channelId;
        if (botVoiceChannelId && voiceChannel.id !== botVoiceChannelId) {
            await command.replyEphemeralError(
                bot,
                command.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'),
            );
            return null;
        }

        const blockedUsers = isUserInBlacklist(
            voiceChannel,
            bot.config.blacklist,
            bot.blacklistManager,
        );
        if (blockedUsers.length > 0) {
            await command.reply({
                embeds: [embeds.blacklist(bot, blockedUsers, command.language)],
            });
            return null;
        }

        return voiceChannel;
    }

    /**
     * Create or reuse the guild player and initialize related state
     */
    private async initializePlayer(
        context: PlaylistSubcommandContext,
        voiceChannel: VoiceBasedChannel,
    ): Promise<Player | null> {
        const { bot, client, command } = context;
        let player = client.lavashark.getPlayer(command.guild!.id);
        if (!player) {
            player = client.lavashark.createPlayer({
                guildId: command.guild!.id,
                selfDeaf: true,
                textChannelId: command.channel!.id,
                voiceChannelId: voiceChannel.id,
            });
        }

        if (!player.setting) {
            player.setting = {
                fairQueueRotation: [],
                queuePage: null,
                volume: null,
            };
        }

        // Store the source so dashboard updates can target the command channel
        const metadata = command.isMessage()
            ? command.getMessage()
            : command.getInteraction();
        try {
            if (player.voiceChannelId !== voiceChannel.id) {
                player.setVoiceChannel(voiceChannel.id);
            }
            // connect() is idempotent: it only sends a voice state update when
            // the player is not already connected, so always call it — a fresh
            // player would otherwise never join the voice channel
            await player.connect();
            player.metadata = metadata;
        } catch (error) {
            bot.logger.error(
                bot.shardId,
                `[PlaylistCommand] Error joining channel: ${error}`,
            );
            await command.replyEphemeralError(
                bot,
                command.t('commands:ERROR_PLAY_JOIN_CHANNEL'),
            );
            await player.destroy();
            return null;
        }

        try {
            if (!player.dashboardMsg) {
                await client.dashboard.initialize(metadata, player);
            }
        } catch {
            await client.dashboard.destroy(player);
        }

        // Assign the first eligible requester as the dynamic DJ
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC &&
            !DJManager.hasDJSet(player)) {
            const isAdmin = bot.config.bot.admin.includes(command.user.id);
            const hasDJRoleUser = DJManager.hasDJRoleInChannel(bot, voiceChannel);
            if (!isAdmin && !hasDJRoleUser) {
                DJManager.addDJ(player, command.user.id);
            }
        }

        return player;
    }

    /**
     * Resolve a stored track using encoded data, URL, then title search.
     * YouTube mix/playlist URLs (`watch?v=X&list=...`) resolve as a
     * PLAYLIST result, so the whole playlist is expanded into the queue.
     */
    private async findTrack(
        context: PlaylistSubcommandContext,
        playlistTrack: PlaylistTrack,
    ): Promise<any[] | null> {
        if (playlistTrack.encoded) {
            const track = await decodeTrackWithRetry(
                context.client.lavashark,
                playlistTrack.encoded,
            );
            if (track) return [track];
        }

        const queries = [
            playlistTrack.url,
            `ytsearch:${playlistTrack.title}`,
        ].filter((query): query is string => Boolean(query));

        for (const query of new Set(queries)) {
            const result = await searchWithRetry(context.client.lavashark, query);
            if (result && Array.isArray(result.tracks) && result.tracks.length > 0) {
                if (result.loadType === LoadType.PLAYLIST) {
                    // Mix/playlist expansion keeps the real track names
                    return result.tracks;
                }
                const track = result.tracks[0];
                // Keep the name exactly as it was saved, even if the fallback
                // search resolved to a different video
                if (playlistTrack.title) track.title = playlistTrack.title;
                if (playlistTrack.author) track.author = playlistTrack.author;
                if (playlistTrack.url) track.uri = playlistTrack.url;
                return [track];
            }
        }

        return null;
    }

    /**
     * Resolve and enqueue tracks while respecting queue limits.
     * Tracks carrying a saved encoded string are bulk-decoded in a single
     * request (`/decodetracks`) — Lavalink nodes rate-limit REST calls
     * (HTTP 429), and bursting per-track requests makes tracks get skipped.
     * Entries without an encoded string fall back to paced per-track lookup.
     */
    private async loadTracks(
        context: PlaylistSubcommandContext,
        player: Player,
        playlist: Playlist,
        member: GuildMember,
    ): Promise<PlaylistLoadResult> {
        let added = 0;
        let skipped = 0;
        const tracks = playlist.tracks ?? [];
        const TRACK_REQUEST_DELAY_MS = 400;

        const canAdd = (): boolean => QueueLimitManager.canAddSongs(
            context.bot,
            player,
            context.command.user.id,
            member,
            1,
        ).canAdd;

        const entries = tracks.map((track, index) => ({ track, index }));
        const resolvedByIndex: Map<number, any[]> = new Map();

        // Bulk-decode entries that carry a saved encoded track string
        const encodedEntries = entries.filter(({ track }) =>
            track.encoded && track.encoded.trim() !== '',
        );
        if (encodedEntries.length > 0) {
            const decoded = await decodeTracksWithRetry(
                context.client.lavashark,
                encodedEntries.map(({ track }) => track.encoded!.trim()),
            );
            if (decoded && decoded.length === encodedEntries.length) {
                encodedEntries.forEach(({ track, index }, i) => {
                    if (decoded[i] && canAdd()) {
                        // Keep the names exactly as they were saved
                        if (track.title) decoded[i].title = track.title;
                        if (track.author) decoded[i].author = track.author;
                        if (track.url) decoded[i].uri = track.url;
                        resolvedByIndex.set(index, [decoded[i]]);
                        added++;
                    }
                });
            }
        }

        // Per-track fallback for entries not covered by the bulk decode
        for (const { track, index } of entries) {
            if (resolvedByIndex.has(index)) {
                continue;
            }

            if (!canAdd()) {
                skipped++;
                await sleep(TRACK_REQUEST_DELAY_MS);
                continue;
            }

            const result = await this.findTrack(context, track);
            if (result && result.length > 0) {
                resolvedByIndex.set(index, result);
                added += result.length;
            } else {
                skipped++;
            }
            await sleep(TRACK_REQUEST_DELAY_MS);
        }

        const resolvedTracks = entries.flatMap(({ index }) => resolvedByIndex.get(index) ?? []);
        if (resolvedTracks.length > 0) {
            const requester = context.command.user as unknown as PlayerRequester;
            player.addTracks(resolvedTracks, requester);
        }

        return { added, skipped };
    }

    /**
     * Start an idle player or refresh the dashboard for an active player
     */
    private async startPlayback(
        context: PlaylistSubcommandContext,
        player: Player,
    ): Promise<void> {
        if (!player.playing) {
            const volume = player.setting.volume ??
                context.bot.guildVolumeManager?.get(player.guildId) ??
                context.bot.config.bot.volume.default;
            player.filters.setVolume(volume);

            // Retry playback a few times so a transient rate limit (HTTP 429)
            // does not destroy the player right after loading a playlist
            const PLAY_RETRY_ATTEMPTS = 3;
            const PLAY_RETRY_DELAY_MS = 2000;
            for (let attempt = 0; attempt < PLAY_RETRY_ATTEMPTS; attempt++) {
                try {
                    await player.play();
                    return;
                } catch (error) {
                    if (attempt < PLAY_RETRY_ATTEMPTS - 1) {
                        context.bot.logger.log(
                            context.bot.shardId,
                            `[PlaylistCommand] Error playing track (attempt ${attempt + 1}/${PLAY_RETRY_ATTEMPTS}): ${error}`,
                        );
                        await sleep(PLAY_RETRY_DELAY_MS);
                        continue;
                    }
                    context.bot.logger.error(
                        context.bot.shardId,
                        `[PlaylistCommand] Error playing track: ${error}`,
                    );
                    await player.destroy();
                }
            }
            return;
        }

        if (player.current) {
            await context.client.dashboard.update(player, player.current);
        }
    }
}
