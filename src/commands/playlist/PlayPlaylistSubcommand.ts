import { DJModeEnum } from '../../@types/index.js';
import { embeds } from '../../embeds/index.js';
import { DJManager } from '../../lib/DjManager.js';
import { QueueLimitManager } from '../../lib/QueueLimitManager.js';
import { isUserInBlacklist } from '../../utils/functions/isUserInBlacklist.js';
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
            if (!player.voiceChannelId || player.voiceChannelId !== voiceChannel.id) {
                await player.connect();
            }
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
     * Resolve a stored track using encoded data, URL, then title search
     */
    private async findTrack(
        context: PlaylistSubcommandContext,
        playlistTrack: PlaylistTrack,
    ) {
        if (playlistTrack.encoded) {
            try {
                const result = await context.client.lavashark.search(playlistTrack.encoded);
                if (result.tracks.length > 0) return result.tracks[0];
            } catch {
                // Try next query
            }
        }

        if (playlistTrack.url && (playlistTrack.url.startsWith('http://') || playlistTrack.url.startsWith('https://'))) {
            try {
                const result = await context.client.lavashark.search(playlistTrack.url);
                if (result.tracks.length > 0) return result.tracks[0];
            } catch {
                // Try next query
            }
        }

        const cleanTitle = playlistTrack.title
            ?.replace(/\.(mp3|flac|wav|aac|ogg|m4a|webm)$/i, '')
            .trim();

        if (!cleanTitle || cleanTitle.length < 3) {
            return null;
        }

        const searchQuery = playlistTrack.author
            ? `ytsearch:${playlistTrack.author} - ${cleanTitle}`
            : `ytsearch:${cleanTitle}`;

        try {
            const result = await context.client.lavashark.search(searchQuery);
            if (result.tracks.length > 0) return result.tracks[0];
        } catch {
            // Track search failed
        }

        return null;
    }

    /**
     * Resolve and enqueue tracks while respecting queue limits
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
        const BATCH_SIZE = 5;

        const resolvedTracks: any[] = [];

        for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
            const chunk = tracks.slice(i, i + BATCH_SIZE);
            const promises = chunk.map(async (playlistTrack) => {
                const limit = QueueLimitManager.canAddSongs(
                    context.bot,
                    player,
                    context.command.user.id,
                    member,
                    1,
                );
                if (!limit.canAdd) {
                    return null;
                }

                try {
                    return await this.findTrack(context, playlistTrack);
                } catch {
                    return null;
                }
            });

            const results = await Promise.all(promises);
            for (const track of results) {
                if (track) {
                    resolvedTracks.push(track);
                    added++;
                } else {
                    skipped++;
                }
            }
        }

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

            try {
                await player.play();
            } catch (error) {
                context.bot.logger.error(
                    context.bot.shardId,
                    `[PlaylistCommand] Error playing track: ${error}`,
                );
                await player.destroy();
            }
            return;
        }

        if (player.current) {
            await context.client.dashboard.update(player, player.current);
        }
    }
}
