import { ChannelType } from 'discord.js';

import type { Client } from 'discord.js';
import type { Player, Track } from 'lavashark';
import type { Bot, QueueTableRow } from '../@types/index.js';
import {
    decodeTracksWithRetry,
    decodeTrackWithRetry,
    searchWithRetry,
    sleep,
} from '../utils/functions/lavasharkRequest.js';


/**
 * Persisted queue data structure
 */
interface PersistedQueue {
    guildId: string;
    voiceChannelId: string;
    textChannelId: string;
    tracks: SerializedTrack[];
    currentTrackIndex: number;
    volume: number;
    repeatMode: number;
    paused: boolean;
    position: number;
    timestamp: number;
}

/**
 * Serialized track structure for storage
 */
interface SerializedTrack {
    track: string;
    info: {
        identifier: string;
        title: string;
        author: string;
        length: number;
        uri: string;
        sourceName: string;
        isSeekable: boolean;
        isStream: boolean;
    };
    requesterId: string;
    requesterTag: string;
}

/**
 * Format milliseconds as a duration label (mirrors lavashark's formatTime)
 */
const formatDurationLabel = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeString = '';
    if (days > 0) {
        timeString += `${days}d `;
    }
    if (hours % 24 > 0) {
        timeString += `${(hours % 24).toString().padStart(2, '0')}:`;
    }
    timeString += `${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return timeString;
};

/**
 * Manager for persisting queue state to SQLite database
 */
export class QueuePersistence {
    private static readonly PERIODIC_SAVE_INTERVAL = 30_000; // 30 seconds

    private bot: Bot;
    private periodicSaveTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

    constructor(bot: Bot) {
        this.bot = bot;
    }

    /**
     * Initialize queue persistence after shared database setup.
     */
    public initialize(): void {
        if (!this.bot.config.queuePersistence.enabled) {
            this.bot.logger.log(this.bot.shardId, '[QueuePersistence] Queue persistence is disabled.');
            return;
        }

        if (!this.bot.databaseManager?.getDatabase()) {
            this.bot.logger.error(this.bot.shardId, '[QueuePersistence] Database is not initialized.');
            return;
        }

        this.bot.logger.log(this.bot.shardId, '[QueuePersistence] Queue persistence initialized.');
    }

    /**
     * Save a player's queue state to the database
     * @param player - Player instance to save
     */
    public async saveQueue(player: Player): Promise<void> {
        if (!this.bot.config.queuePersistence.enabled || !this.bot.databaseManager?.getDatabase()) {
            return;
        }

        try {
            // Save as long as player.current exists (even if queue.tracks is empty)
            if (!player.current) {
                this.deleteQueue(player.guildId);
                return;
            }

            const serializeTrack = (track: Track): SerializedTrack | null => {
                if (!track) return null;
                const encodedTrack = ('encoded' in track && typeof track.encoded === 'string') ? track.encoded : ((track as any).track ?? '');
                return {
                    track: encodedTrack,
                    info: {
                        identifier: track.identifier || '',
                        title: track.title || '',
                        author: track.author || '',
                        length: typeof track.duration === 'number' ? track.duration : (track.duration?.value ?? 0),
                        uri: track.uri || '',
                        sourceName: (track as any).sourceName || 'youtube',
                        isSeekable: track.isSeekable ?? true,
                        isStream: track.isStream ?? false
                    },
                    requesterId: track.requester?.id || '',
                    requesterTag: track.requester?.tag || ''
                };
            };

            // Include current track at front of saved tracks list
            const serializedTracks: SerializedTrack[] = [];

            const currentSerialized = serializeTrack(player.current);
            if (currentSerialized) {
                serializedTracks.push(currentSerialized);
            }

            // Append queue tracks
            for (const track of player.queue.tracks) {
                const s = serializeTrack(track as Track);
                if (s) serializedTracks.push(s);
            }

            const currentVolume = player.volume ?? (player.setting as any)?.volume ?? this.bot.guildVolumeManager?.get(player.guildId) ?? this.bot.config.bot.volume.default;

            const queueData: PersistedQueue = {
                guildId: player.guildId,
                voiceChannelId: player.voiceChannelId || '',
                textChannelId: player.textChannelId || '',
                tracks: serializedTracks,
                currentTrackIndex: 0,
                volume: currentVolume,
                repeatMode: player.repeatMode,
                paused: player.paused,
                position: player.position,
                timestamp: Date.now()
            };

            this.bot.databaseManager.executeTransaction(
                (db, data: PersistedQueue) => {
                    db.prepare(`
                        INSERT OR REPLACE INTO queues
                        (
                            guild_id,
                            voice_channel_id,
                            text_channel_id,
                            tracks,
                            current_track_index,
                            volume,
                            repeat_mode,
                            paused,
                            position,
                            timestamp
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        data.guildId,
                        data.voiceChannelId,
                        data.textChannelId,
                        JSON.stringify(data.tracks),
                        data.currentTrackIndex,
                        data.volume,
                        data.repeatMode,
                        data.paused ? 1 : 0,
                        data.position,
                        data.timestamp
                    );
                },
                queueData
            );

            this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Saved queue for guild ${player.guildId} (${serializedTracks.length} tracks)`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to save queue for guild ${player.guildId}: ${error}`);
        }
    }

    /**
     * Load all persisted queues from the database
     * @param client - Discord client instance
     * @returns Array of persisted queue data
     */
    public loadQueues(_client: Client): PersistedQueue[] {
        const db = this.bot.databaseManager?.getDatabase();
        if (!this.bot.config.queuePersistence.enabled || !db) {
            return [];
        }

        try {
            const stmt = db.prepare(`
                SELECT
                    guild_id,
                    voice_channel_id,
                    text_channel_id,
                    tracks,
                    current_track_index,
                    volume,
                    repeat_mode,
                    paused,
                    position,
                    timestamp
                FROM queues
            `);
            const rows = stmt.all() as QueueTableRow[];

            const queues: PersistedQueue[] = [];

            for (const row of rows) {
                try {
                    queues.push({
                        guildId: row.guild_id,
                        voiceChannelId: row.voice_channel_id,
                        textChannelId: row.text_channel_id,
                        tracks: JSON.parse(row.tracks),
                        currentTrackIndex: row.current_track_index,
                        volume: row.volume,
                        repeatMode: row.repeat_mode,
                        paused: row.paused === 1,
                        position: row.position,
                        timestamp: row.timestamp
                    });
                } catch (parseError) {
                    this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Corrupted queue data for guild ${row.guild_id}, skipping: ${parseError}`);
                    this.deleteQueue(row.guild_id);
                }
            }

            this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Loaded ${queues.length} persisted queue(s)`);

            return queues;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to load queues: ${error}`);
            return [];
        }
    }

    /**
     * Restore a persisted queue to a player
     * @param client - Discord client instance
     * @param queueData - Persisted queue data
     */
    public async restoreQueue(client: Client, queueData: PersistedQueue): Promise<void> {
        try {
            const guild = client.guilds.cache.get(queueData.guildId);
            if (!guild) {
                this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Guild ${queueData.guildId} not found, skipping queue restore`);
                this.deleteQueue(queueData.guildId);
                return;
            }

            const voiceChannel = guild.channels.cache.get(queueData.voiceChannelId);
            if (!voiceChannel || !voiceChannel.isVoiceBased()) {
                this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Voice channel ${queueData.voiceChannelId} not found or not voice-based, skipping queue restore`);
                this.deleteQueue(queueData.guildId);
                return;
            }

            // Check if there are any members in the voice channel (excluding bots)
            const hasMembers = voiceChannel.members.filter(m => !m.user.bot).size > 0;
            if (!hasMembers) {
                this.bot.logger.log(this.bot.shardId, `[QueuePersistence] No members in voice channel ${queueData.voiceChannelId}, skipping queue restore`);
                return;
            }

            // Create or get player
            let player = client.lavashark.players.get(queueData.guildId);
            if (!player) {
                player = client.lavashark.createPlayer({
                    guildId: queueData.guildId,
                    voiceChannelId: queueData.voiceChannelId,
                    textChannelId: queueData.textChannelId,
                    selfDeaf: true,
                    selfMute: false
                });
            }

            if (!player.setting) {
                player.setting = {
                    queuePage: null,
                    volume: null,
                    fairQueueRotation: []
                };
            }

            // Initialize dashboard if text channel is available
            const textChannel = guild.channels.cache.get(queueData.textChannelId);
            if (textChannel && (textChannel.type === ChannelType.GuildText || textChannel.type === ChannelType.GuildAnnouncement)) {
                try {
                    await client.dashboard.initialize(textChannel as any, player);
                } catch (error) {
                    this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to initialize dashboard for guild ${queueData.guildId}: ${error}`);
                }
            }

            // Bulk-decode saved encoded tracks in a single request — Lavalink
            // nodes rate-limit REST calls (HTTP 429), so per-track requests
            // would exhaust the node budget. Fall back to paced per-track
            // restore for anything the bulk decode did not cover.
            const serializedEntries = queueData.tracks.map((track, index) => ({ track, index }));
            const restoredByIndex: Map<number, any> = new Map();
            const TRACK_REQUEST_DELAY_MS = 400;

            const encodedEntries = serializedEntries.filter(({ track }) =>
                track.track && track.track.trim() !== '',
            );
            if (encodedEntries.length > 0) {
                const decoded = await decodeTracksWithRetry(
                    client.lavashark,
                    encodedEntries.map(({ track }) => track.track.trim()),
                );
                if (decoded && decoded.length === encodedEntries.length) {
                    encodedEntries.forEach(({ track, index }, i) => {
                        if (decoded[i]) {
                            restoredByIndex.set(
                                index,
                                this.applySerializedMetadata(decoded[i], track),
                            );
                        }
                    });
                }
            }

            const allRestoredTracks: any[] = [];
            for (const { track, index } of serializedEntries) {
                const restored = restoredByIndex.get(index);
                if (restored) {
                    allRestoredTracks.push(restored);
                    continue;
                }

                const fallback = await this.restoreTrack(client, track);
                if (fallback) {
                    allRestoredTracks.push(fallback);
                }
                await sleep(TRACK_REQUEST_DELAY_MS);
            }

            for (const track of allRestoredTracks) {
                player.queue.add(track);
            }

            // Restore settings
            player.setRepeatMode(queueData.repeatMode);

            // Connect and play
            await player.connect();
            if (!player.playing && !player.paused && player.queue.tracks.length > 0) {
                await player.play();
            }

            if (queueData.paused && player.playing) {
                await player.pause();
            }

            // Set volume after playback starts
            if (!player.setting) {
                player.setting = { queuePage: null, volume: queueData.volume, fairQueueRotation: [] };
            } else {
                player.setting.volume = queueData.volume;
            }
            player.filters.setVolume(queueData.volume);

            // Seek to saved position after playback starts
            if (queueData.position > 0) {
                // Wait briefly for the player to initialize playback before seeking
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    if (player.playing || player.paused) {
                        await player.seek(queueData.position);
                        this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Seeked to position ${queueData.position}ms for guild ${queueData.guildId}`);
                    }
                } catch (error) {
                    this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to seek to position for guild ${queueData.guildId}: ${error}`);
                }
            }

            this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Restored queue for guild ${queueData.guildId} (${queueData.tracks.length} tracks)`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to restore queue for guild ${queueData.guildId}: ${error}`);
        }
    }

    /**
     * Resolve a single serialized track back into a playable track.
     * Decodes the saved encoded string first (exact restore), then falls back
     * to searching by URI, then by title + author. Requests are retried once
     * each because Lavalink nodes rate-limit REST calls (HTTP 429).
     */
    private async restoreTrack(
        client: Client,
        serializedTrack: SerializedTrack,
    ): Promise<any | null> {
        try {
            let resolvedTrack: any = null;

            // 1) Decode the saved encoded track exactly (preserves the original track data)
            if (serializedTrack.track && serializedTrack.track.trim() !== '') {
                resolvedTrack = await decodeTrackWithRetry(
                    client.lavashark,
                    serializedTrack.track,
                );
            }

            // 2) Fallback: search by URI
            if (!resolvedTrack && serializedTrack.info?.uri && serializedTrack.info.uri.trim() !== '') {
                const result = await searchWithRetry(client.lavashark, serializedTrack.info.uri);
                if (result && Array.isArray(result.tracks) && result.tracks.length > 0) {
                    resolvedTrack = result.tracks[0];
                }
            }

            // 3) Final fallback: search by title + author
            if (!resolvedTrack && serializedTrack.info?.title && serializedTrack.info.title.trim() !== '') {
                const query = serializedTrack.info.author
                    ? `${serializedTrack.info.title} ${serializedTrack.info.author}`.trim()
                    : serializedTrack.info.title.trim();
                const result = await searchWithRetry(client.lavashark, `ytsearch:${query}`);
                if (result && Array.isArray(result.tracks) && result.tracks.length > 0) {
                    resolvedTrack = result.tracks[0];
                }
            }

            if (resolvedTrack) {
                return this.applySerializedMetadata(resolvedTrack, serializedTrack);
            }

            this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Could not restore track "${serializedTrack.info.title}", skipping`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to restore track ${serializedTrack.info.title}: ${error}`);
        }
        return null;
    }

    /**
     * Restore the originally saved metadata so names are never replaced by
     * whatever the fallback search returned
     */
    private applySerializedMetadata(track: any, serializedTrack: SerializedTrack): any {
        const info = serializedTrack.info ?? {};
        if (info.title) track.title = info.title;
        if (info.author) track.author = info.author;
        if (info.uri) track.uri = info.uri;
        if (info.identifier) track.identifier = info.identifier;
        if (typeof info.length === 'number' && info.length > 0) {
            track.duration = {
                label: formatDurationLabel(info.length),
                value: info.length,
            };
        }
        track.requester = {
            id: serializedTrack.requesterId,
            tag: serializedTrack.requesterTag
        } as any;
        return track;
    }

    /**
     * Check if any persisted queues exist for a specific voice channel
     * @param voiceChannelId - Voice channel ID to check
     * @returns true if a persisted queue exists for this channel
     */
    public hasPersistedQueueForChannel(voiceChannelId: string): boolean {
        const db = this.bot.databaseManager?.getDatabase();
        if (!this.bot.config.queuePersistence.enabled || !db) {
            return false;
        }

        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM queues WHERE voice_channel_id = ?');
            const row = stmt.get(voiceChannelId) as { count: number };
            return row.count > 0;
        } catch {
            return false;
        }
    }

    /**
     * Delete a persisted queue from the database
     * @param guildId - Guild ID
     */
    public deleteQueue(guildId: string): void {
        if (!this.bot.config.queuePersistence.enabled || !this.bot.databaseManager?.getDatabase()) {
            return;
        }

        try {
            this.bot.databaseManager.executeTransaction((db, id: string) => {
                db.prepare('DELETE FROM queues WHERE guild_id = ?').run(id);
            }, guildId);

            this.bot.logger.log(this.bot.shardId, `[QueuePersistence] Deleted queue for guild ${guildId}`);
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Failed to delete queue for guild ${guildId}: ${error}`);
        }
    }

    /**
     * Start periodic position saving for a player
     * @param player - Player instance to periodically save
     */
    public startPeriodicSave(player: Player): void {
        if (!this.bot.config.queuePersistence.enabled || !this.bot.databaseManager?.getDatabase()) {
            return;
        }

        // Clear any existing timer for this guild
        this.stopPeriodicSave(player.guildId);

        const timer = setInterval(async () => {
            try {
                if (player.playing && player.current) {
                    await this.saveQueue(player);
                }
            } catch (error) {
                this.bot.logger.error(this.bot.shardId, `[QueuePersistence] Periodic save failed for guild ${player.guildId}: ${error}`);
            }
        }, QueuePersistence.PERIODIC_SAVE_INTERVAL);

        this.periodicSaveTimers.set(player.guildId, timer);
    }

    /**
     * Stop periodic position saving for a guild
     * @param guildId - Guild ID
     */
    public stopPeriodicSave(guildId: string): void {
        const timer = this.periodicSaveTimers.get(guildId);
        if (timer) {
            clearInterval(timer);
            this.periodicSaveTimers.delete(guildId);
        }
    }

    /**
     * Stop all periodic save timers
     */
    public stopAllPeriodicSaves(): void {
        for (const [guildId, timer] of this.periodicSaveTimers) {
            clearInterval(timer);
            this.periodicSaveTimers.delete(guildId);
        }
    }

    /**
     * Stop periodic queue save timers.
     */
    public close(): void {
        this.stopAllPeriodicSaves();
    }
}
