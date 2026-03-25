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
     * Called after a track ends to rotate queue so next song is from a different user.
     * Present (in-channel) users are prioritized for rotation; absent users' songs
     * are only played when all present users' songs have been exhausted in a round.
     */
    public static reorderQueue(bot: Bot, player: Player, voiceChannel: VoiceChannel | null): void {
        if (!bot.config.bot.fairQueue) {
            return;
        }

        if (!player.queue || !player.queue.tracks || player.queue.tracks.length <= 1) {
            return;
        }

        const lastPlayedUserId = player.current?.requester?.id;
        if (!lastPlayedUserId) {
            return;
        }

        // Get list of users currently in voice channel
        const activeUserIds = voiceChannel
            ? new Set(voiceChannel.members.filter(m => !m.user.bot).keys())
            : null;

        // Categorize tracks by user, preserving first-appearance order
        const presentUserOrder: string[] = [];
        const absentUserOrder: string[] = [];
        const tracksByUser = new Map<string, (Track | any)[]>();

        for (const track of player.queue.tracks) {
            const userId = track.requester?.id;
            if (!userId) continue;

            if (!tracksByUser.has(userId)) {
                tracksByUser.set(userId, []);
                const isPresent = !activeUserIds || activeUserIds.has(userId);
                if (isPresent) {
                    presentUserOrder.push(userId);
                } else {
                    absentUserOrder.push(userId);
                }
            }
            tracksByUser.get(userId)!.push(track);
        }

        // Determine rotation order: present users first, then absent users as fallback
        // This ensures absent users' songs still get played, just at lower priority
        const userOrder = presentUserOrder.length > 0
            ? presentUserOrder
            : absentUserOrder;

        if (userOrder.length <= 1) {
            return;
        }

        // Find where the last played user sits in rotation
        let lastUserIndex = userOrder.indexOf(lastPlayedUserId);
        if (lastUserIndex === -1) {
            lastUserIndex = userOrder.length - 1; // Will wrap to index 0
        }

        const nextUserIndex = (lastUserIndex + 1) % userOrder.length;
        const nextUserId = userOrder[nextUserIndex];

        if (nextUserId === lastPlayedUserId) {
            return;
        }

        // Move the first song from the next user to the front of the queue
        const nextUserTracks = tracksByUser.get(nextUserId)!;
        const trackToMove = nextUserTracks[0];

        const trackIndex = player.queue.tracks.findIndex(t => t === trackToMove);

        if (trackIndex > 0) {
            player.queue.tracks.splice(trackIndex, 1);
            player.queue.tracks.unshift(trackToMove as any);

            bot.logger.emit('log', bot.shardId,
                `[FairQueue] Reordered queue: moved track from user ${nextUserId} to front (was at position ${trackIndex}, rotation: ${userOrder.join(' -> ')})`
            );
        }
    }

    /**
     * Get statistics about queue distribution among users
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
