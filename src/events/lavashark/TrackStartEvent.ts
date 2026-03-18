import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { setVoiceChannelStatus } from '../../utils/functions/setVoiceStatus.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackStart event handler
 * Updates dashboard when a track starts playing
 */
export class TrackStartEvent extends BaseLavaSharkEvent<'trackStart'> {
    public getEventName(): 'trackStart' {
        return 'trackStart';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        const track = player.current;
        await client.dashboard.update(player, track!);

        // Set voice channel status with track info
        if (track && player.voiceChannelId) {
            const emojis = bot.config.bot.voiceStatusEmojis;
            if (emojis.length > 0) {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                const title = track.title.length > 80 ? track.title.substring(0, 77) + '...' : track.title;
                await setVoiceChannelStatus(bot, client, player.voiceChannelId, `${emoji} ${title}`);
            }
        }

        // Save queue state on each track start
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            await (client as any).queuePersistence.saveQueue(player);
        }
    }
}
