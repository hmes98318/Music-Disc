import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { FairQueueManager } from '../../lib/FairQueueManager.js';
import { ChannelType } from 'discord.js';

import type { Client } from 'discord.js';
import type { Player, Track } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackEnd event handler
 * Handles fair queue rotation after a track ends
 */
export class TrackEndEvent extends BaseLavaSharkEvent<'trackEnd'> {
    public getEventName(): 'trackEnd' {
        return 'trackEnd';
    }

    public async execute(bot: Bot, client: Client, player: Player, _track: Track, _reason: any): Promise<void> {
        // Store last played track for /playlast command
        if (_track) {
            client.lastPlayedTracks.set(player.guildId, _track);
        }

        try {
            // Get voice channel
            const guild = client.guilds.cache.get(player.guildId);
            const voiceChannel = guild?.channels.cache.get(player.voiceChannelId || '');
            
            // Apply fair queue rotation if enabled (only for guild voice channels)
            if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
                FairQueueManager.reorderQueue(bot, player, voiceChannel);
            }
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `[TrackEndEvent] Error: ${error}`);
        }
    }
}
