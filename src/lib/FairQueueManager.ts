import type { Player, Track } from 'lavashark';
import type { VoiceChannel } from 'discord.js';
import type { Bot } from '../@types/index.js';

/**
 * Manager for handling fair queue rotation (round-robin)
 * Ensures songs from different users are played in rotation
 */
export class FairQueueManager {
    /**
     * Reorder the queue to implement fair rotation (round-robin)
     * Called after a track ends to rotate queue so next song is from a different user
     * @param bot - Bot instance
     * @param player - Player instance
     * @param voiceChannel - Voice channel to check active users
     */
    public static reorderQueue(bot: Bot, player: Player, voiceChannel: VoiceChannel | null): void {
        // Check if fair queue is enabled
        if (!bot.config.bot.fairQueue) {
            return;
        }

        // No reordering needed if queue is empty or has only one track
        if (!player.queue || !player.queue.tracks || player.queue.tracks.length <= 1) {
            return;
        }

        // Get the last played user ID
        const lastPlayedUserId = player.current?.requester?.id;
        if (!lastPlayedUserId) {
            return;
        }

        // Get list of users currently in voice channel (optional filter)
        const activeUserIds = voiceChannel 
            ? Array.from(voiceChannel.members.filter(m => !m.user.bot).keys())
            : null;

        // Group tracks by user ID
        const tracksByUser = new Map<string, (Track | any)[]>();
        for (const track of player.queue.tracks) {
            const userId = track.requester?.id;
            if (!userId) continue;

            // If we're filtering by active users, skip users not in voice channel
            if (activeUserIds && !activeUserIds.includes(userId)) {
                continue;
            }

            if (!tracksByUser.has(userId)) {
                tracksByUser.set(userId, []);
            }
            tracksByUser.get(userId)!.push(track);
        }

        // If only one user has songs in queue, no reordering needed
        if (tracksByUser.size <= 1) {
            return;
        }

        // Find next user in rotation (not the last played user)
        const userIds = Array.from(tracksByUser.keys());
        let nextUserId: string | null = null;

        // Try to find a user different from the last one
        for (const userId of userIds) {
            if (userId !== lastPlayedUserId) {
                nextUserId = userId;
                break;
            }
        }

        // If all songs are from the same user, no reordering needed
        if (!nextUserId) {
            return;
        }

        // Reorder queue: Move first song from nextUserId to front
        const nextUserTracks = tracksByUser.get(nextUserId)!;
        const trackToMove = nextUserTracks[0];
        
        // Find index of this track in the actual queue
        const trackIndex = player.queue.tracks.findIndex(t => t === trackToMove);
        
        if (trackIndex > 0) {
            // Remove track from its current position
            player.queue.tracks.splice(trackIndex, 1);
            // Insert at the front
            player.queue.tracks.unshift(trackToMove as any);
            
            bot.logger.emit('log', bot.shardId, 
                `[FairQueue] Reordered queue: moved track from user ${nextUserId} to front (was at position ${trackIndex})`
            );
        }
    }

    /**
     * Get statistics about queue distribution among users
     * @param player - Player instance
     * @returns Object with user distribution stats
     */
    public static getQueueDistribution(player: Player): Map<string, number> {
        const distribution = new Map<string, number>();

        if (!player.queue || !player.queue.tracks) {
            return distribution;
        }

        for (const track of player.queue.tracks) {
            const userId = track.requester?.id;
            if (!userId) continue;

            distribution.set(userId, (distribution.get(userId) || 0) + 1);
        }

        return distribution;
    }
}
