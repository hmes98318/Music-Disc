import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Player, Track } from 'lavashark';
import type { Bot } from '../@types/index.js';
import type { Client } from 'discord.js';

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
 * Manager for persisting queue state to SQLite database
 */
export class QueuePersistence {
    private static readonly PERIODIC_SAVE_INTERVAL = 30_000; // 30 seconds

    private db: Database.Database | null = null;
    private bot: Bot;
    private dbPath: string;
    private periodicSaveTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

    constructor(bot: Bot) {
        this.bot = bot;
        this.dbPath = bot.config.queuePersistence.path;
    }

    /**
     * Initialize the SQLite database and create tables
     */
    public initialize(): void {
        if (!this.bot.config.queuePersistence.enabled) {
            this.bot.logger.emit('log', this.bot.shardId, '[QueuePersistence] Queue persistence is disabled.');
            return;
        }

        try {
            // Ensure directory exists
            const dir = dirname(this.dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            // Open database
            this.db = new Database(this.dbPath);
            
            // Create tables
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS queues (
                    guild_id TEXT PRIMARY KEY,
                    voice_channel_id TEXT NOT NULL,
                    text_channel_id TEXT NOT NULL,
                    tracks TEXT NOT NULL,
                    current_track_index INTEGER NOT NULL,
                    volume INTEGER NOT NULL,
                    repeat_mode INTEGER NOT NULL,
                    paused INTEGER NOT NULL,
                    position INTEGER NOT NULL,
                    timestamp INTEGER NOT NULL
                )
            `);

            this.bot.logger.emit('log', this.bot.shardId, `[QueuePersistence] Database initialized at ${this.dbPath}`);
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, `[QueuePersistence] Failed to initialize database: ${error}`);
        }
    }

    /**
     * Save a player's queue state to the database
     * @param player - Player instance to save
     */
    public async saveQueue(player: Player): Promise<void> {
        if (!this.bot.config.queuePersistence.enabled || !this.db) {
            return;
        }

        try {
            // Save as long as player.current exists (even if queue.tracks is empty)
            if (!player.current) {
                this.deleteQueue(player.guildId);
                return;
            }

            const serializeTrack = (track: Track): SerializedTrack | null => {
                if (!('encoded' in track)) return null;
                return {
                    track: track.encoded,
                    info: {
                        identifier: track.identifier,
                        title: track.title,
                        author: track.author,
                        length: typeof track.duration === 'number' ? track.duration : 0,
                        uri: track.uri,
                        sourceName: (track as any).sourceName || 'youtube',
                        isSeekable: track.isSeekable,
                        isStream: track.isStream
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
                if ('encoded' in track) {
                    const s = serializeTrack(track as Track);
                    if (s) serializedTracks.push(s);
                }
            }

            const queueData: PersistedQueue = {
                guildId: player.guildId,
                voiceChannelId: player.voiceChannelId || '',
                textChannelId: player.textChannelId || '',
                tracks: serializedTracks,
                currentTrackIndex: 0,
                volume: (player as any).volume || 100,
                repeatMode: player.repeatMode,
                paused: player.paused,
                position: player.position,
                timestamp: Date.now()
            };

            // Insert or replace queue
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO queues 
                (guild_id, voice_channel_id, text_channel_id, tracks, current_track_index, volume, repeat_mode, paused, position, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                queueData.guildId,
                queueData.voiceChannelId,
                queueData.textChannelId,
                JSON.stringify(queueData.tracks),
                queueData.currentTrackIndex,
                queueData.volume,
                queueData.repeatMode,
                queueData.paused ? 1 : 0,
                queueData.position,
                queueData.timestamp
            );

            this.bot.logger.emit('log', this.bot.shardId, 
                `[QueuePersistence] Saved queue for guild ${player.guildId} (${serializedTracks.length} tracks)`
            );
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, 
                `[QueuePersistence] Failed to save queue for guild ${player.guildId}: ${error}`
            );
        }
    }

    /**
     * Load all persisted queues from the database
     * @param client - Discord client instance
     * @returns Array of persisted queue data
     */
    public loadQueues(_client: Client): PersistedQueue[] {
        if (!this.bot.config.queuePersistence.enabled || !this.db) {
            return [];
        }

        try {
            const stmt = this.db.prepare('SELECT * FROM queues');
            const rows = stmt.all() as any[];

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
                    this.bot.logger.emit('error', this.bot.shardId,
                        `[QueuePersistence] Corrupted queue data for guild ${row.guild_id}, skipping: ${parseError}`
                    );
                    this.deleteQueue(row.guild_id);
                }
            }

            this.bot.logger.emit('log', this.bot.shardId,
                `[QueuePersistence] Loaded ${queues.length} persisted queue(s)`
            );

            return queues;
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, 
                `[QueuePersistence] Failed to load queues: ${error}`
            );
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
                this.bot.logger.emit('error', this.bot.shardId, 
                    `[QueuePersistence] Guild ${queueData.guildId} not found, skipping queue restore`
                );
                this.deleteQueue(queueData.guildId);
                return;
            }

            const voiceChannel = guild.channels.cache.get(queueData.voiceChannelId);
            if (!voiceChannel || !voiceChannel.isVoiceBased()) {
                this.bot.logger.emit('error', this.bot.shardId, 
                    `[QueuePersistence] Voice channel ${queueData.voiceChannelId} not found or not voice-based, skipping queue restore`
                );
                this.deleteQueue(queueData.guildId);
                return;
            }

            // Check if there are any members in the voice channel (excluding bots)
            const hasMembers = voiceChannel.members.filter(m => !m.user.bot).size > 0;
            if (!hasMembers) {
                this.bot.logger.emit('log', this.bot.shardId, 
                    `[QueuePersistence] No members in voice channel ${queueData.voiceChannelId}, skipping queue restore`
                );
                this.deleteQueue(queueData.guildId);
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

            // Restore tracks - try encoded track string first, fall back to URI search
            for (const serializedTrack of queueData.tracks) {
                try {
                    let result = null;

                    // Try loading by encoded track string first
                    try {
                        result = await client.lavashark.search(serializedTrack.track);
                    } catch (_) {
                        // Encoded string failed, will try fallback
                    }

                    // Fallback: search by URI
                    if (!result || result.tracks.length === 0) {
                        try {
                            result = await client.lavashark.search(serializedTrack.info.uri);
                        } catch (_) {
                            // URI search failed, will try title search
                        }
                    }

                    // Final fallback: search by title + author
                    if (!result || result.tracks.length === 0) {
                        try {
                            result = await client.lavashark.search(`ytsearch:${serializedTrack.info.title} ${serializedTrack.info.author}`);
                        } catch (_) {
                            // All methods failed
                        }
                    }

                    if (result && result.tracks.length > 0) {
                        const track = result.tracks[0];
                        track.requester = {
                            id: serializedTrack.requesterId,
                            tag: serializedTrack.requesterTag
                        } as any;
                        player.queue.add(track);
                    } else {
                        this.bot.logger.emit('log', this.bot.shardId,
                            `[QueuePersistence] Could not restore track "${serializedTrack.info.title}", skipping`
                        );
                    }
                } catch (error) {
                    this.bot.logger.emit('error', this.bot.shardId,
                        `[QueuePersistence] Failed to restore track ${serializedTrack.info.title}: ${error}`
                    );
                }
            }

            // Restore settings
            (player as any).volume = queueData.volume;
            player.setRepeatMode(queueData.repeatMode);

            // Connect and play
            await player.connect();
            if (!player.playing && !player.paused) {
                await player.play();
            }

            // Seek to saved position after playback starts
            if (queueData.position > 0) {
                // Wait briefly for the player to initialize playback before seeking
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    if (player.playing || player.paused) {
                        await player.seek(queueData.position);
                        this.bot.logger.emit('log', this.bot.shardId,
                            `[QueuePersistence] Seeked to position ${queueData.position}ms for guild ${queueData.guildId}`
                        );
                    }
                } catch (error) {
                    this.bot.logger.emit('error', this.bot.shardId,
                        `[QueuePersistence] Failed to seek to position for guild ${queueData.guildId}: ${error}`
                    );
                }
            }

            this.bot.logger.emit('log', this.bot.shardId,
                `[QueuePersistence] Restored queue for guild ${queueData.guildId} (${queueData.tracks.length} tracks)`
            );
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, 
                `[QueuePersistence] Failed to restore queue for guild ${queueData.guildId}: ${error}`
            );
        }
    }

    /**
     * Check if any persisted queues exist for a specific voice channel
     * @param voiceChannelId - Voice channel ID to check
     * @returns true if a persisted queue exists for this channel
     */
    public hasPersistedQueueForChannel(voiceChannelId: string): boolean {
        if (!this.bot.config.queuePersistence.enabled || !this.db) {
            return false;
        }

        try {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM queues WHERE voice_channel_id = ?');
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
        if (!this.bot.config.queuePersistence.enabled || !this.db) {
            return;
        }

        try {
            const stmt = this.db.prepare('DELETE FROM queues WHERE guild_id = ?');
            stmt.run(guildId);

            this.bot.logger.emit('log', this.bot.shardId, 
                `[QueuePersistence] Deleted queue for guild ${guildId}`
            );
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, 
                `[QueuePersistence] Failed to delete queue for guild ${guildId}: ${error}`
            );
        }
    }

    /**
     * Start periodic position saving for a player
     * @param player - Player instance to periodically save
     */
    public startPeriodicSave(player: Player): void {
        if (!this.bot.config.queuePersistence.enabled || !this.db) {
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
                this.bot.logger.emit('error', this.bot.shardId,
                    `[QueuePersistence] Periodic save failed for guild ${player.guildId}: ${error}`
                );
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
     * Close the database connection
     */
    public close(): void {
        this.stopAllPeriodicSaves();
        if (this.db) {
            this.db.close();
            this.bot.logger.emit('log', this.bot.shardId, '[QueuePersistence] Database connection closed.');
        }
    }
}
