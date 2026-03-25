import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { setVoiceChannelStatus } from '../../utils/functions/setVoiceStatus.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * QueueEnd event handler
 * Handles auto-leave, dashboard cleanup, and queue persistence when queue ends
 */
export class QueueEndEvent extends BaseLavaSharkEvent<'queueEnd'> {
    public getEventName(): 'queueEnd' {
        return 'queueEnd';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        // Clear voice channel status
        if (player.voiceChannelId && bot.config.bot.voiceStatusEmojis.length > 0) {
            await setVoiceChannelStatus(bot, client, player.voiceChannelId, null);
        }

        // Delete persisted queue since queue has ended
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            (client as any).queuePersistence.deleteQueue(player.guildId);
        }

        await client.dashboard.destroy(player);

        if (bot.config.bot.autoLeave.enabled) {
            player.destroy();
        }
    }
}
