import type { Player, Track } from 'lavashark';
import type { VoiceChannel } from 'discord.js';
import type { Bot } from '../@types/index.js';

/**
 * Manager for handling fair queue rotation (round-robin)
 * Ensures songs from different users are played in rotation
 */
export class FairQueueManager {
    /**
     * Reorder the queue to implement fair rotation (round-robin).
     * Present (in-channel) users' tracks are interleaved in rotation order.
     * Absent users' tracks are appended at the end in original queue order.
     */
    public static reorderQueue(bot: Bot, player: Player, voiceChannel: VoiceChannel | null): void {
        if (!bot.config.bot.fairQueue) {
            return;
        }

        if (!player.queue || !player.queue.tracks || player.queue.tracks.length <= 1) {
            return;
        }

        const lastPlayedUserId = player.current?.requester?.id;

        // Get present (non-bot) user IDs from voice channel
        const presentUserIds = voiceChannel
            ? new Set(voiceChannel.members.filter(m => !m.user.bot).keys())
            : new Set<string>();

        // Update persistent rotation order
        const rotation = this.updateRotationOrder(player, presentUserIds);
        if (rotation.length === 0) return;

        // Categorize tracks by user presence
        const tracksByUser = new Map<string, (Track | any)[]>();
        const absentTracks: (Track | any)[] = [];

        for (const track of player.queue.tracks) {
            const userId = track.requester?.id;
            if (!userId) {
                absentTracks.push(track);
                continue;
            }
            if (presentUserIds.has(userId)) {
                if (!tracksByUser.has(userId)) tracksByUser.set(userId, []);
                tracksByUser.get(userId)!.push(track);
            }
            else {
                absentTracks.push(track);
            }
        }

        // Find start position: user AFTER lastPlayedUserId in rotation
        let startIndex = 0;
        if (lastPlayedUserId) {
            const lastIdx = rotation.indexOf(lastPlayedUserId);
            if (lastIdx !== -1) {
                startIndex = (lastIdx + 1) % rotation.length;
            }
        }

        // Build interleaved queue via round-robin
        const interleaved: (Track | any)[] = [];
        const consumed = new Map<string, number>();
        for (const userId of rotation) consumed.set(userId, 0);

        let exhausted = false;
        while (!exhausted) {
            exhausted = true;
            for (let i = 0; i < rotation.length; i++) {
                const idx = (startIndex + i) % rotation.length;
                const userId = rotation[idx];
                const userTracks = tracksByUser.get(userId);
                const consumedCount = consumed.get(userId) || 0;
                if (userTracks && consumedCount < userTracks.length) {
                    interleaved.push(userTracks[consumedCount]);
                    consumed.set(userId, consumedCount + 1);
                    exhausted = false;
                }
            }
        }

        // Append absent users' tracks at the end (original queue order)
        interleaved.push(...absentTracks);

        // Replace queue contents
        player.queue.tracks.splice(0, player.queue.tracks.length, ...interleaved);

        bot.logger.emit('log', bot.shardId,
            `[FairQueue] Reordered: ${interleaved.length} tracks, rotation: [${rotation.join(', ')}], absent: ${absentTracks.length}`
        );
    }

    /**
     * Update the persistent rotation order.
     * - Keep existing present users in their current order
     * - Remove users who left
     * - Append newly present users at the end
     */
    private static updateRotationOrder(player: Player, presentUserIds: Set<string>): string[] {
        const existing = player.setting?.fairQueueRotation || [];

        // Keep users who are still present (in original rotation order)
        const kept = existing.filter(id => presentUserIds.has(id));
        const keptSet = new Set(kept);

        // Append new users (present but not in existing rotation)
        const newUsers: string[] = [];
        for (const id of presentUserIds) {
            if (!keptSet.has(id)) {
                newUsers.push(id);
            }
        }

        const rotation = [...kept, ...newUsers];

        // Save back to player setting
        if (player.setting) {
            player.setting.fairQueueRotation = rotation;
        }

        return rotation;
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
