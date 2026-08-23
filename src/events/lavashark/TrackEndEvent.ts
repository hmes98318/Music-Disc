import { ChannelType } from 'discord.js';

import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { FairQueueManager } from '../../lib/FairQueueManager.js';
import { isRadioTrack } from '../../utils/functions/isRadioTrack.js';

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

    public async execute(bot: Bot, client: Client, player: Player, track: Track, _reason: any): Promise<void> {
        // Store last played track for /playlast command
        if (!isRadioTrack(track)) {
            client.lastPlayedTracks.set(player.guildId, track);
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
            bot.logger.error( bot.shardId, `[TrackEndEvent] Error: ${error}`);
        }
    }
}
