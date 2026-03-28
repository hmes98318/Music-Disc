import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { setIdleVoiceStatus, setVoiceChannelStatus } from '../../utils/functions/setVoiceStatus.js';

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
        // Set idle voice status or clear status when queue ends
        if (player.voiceChannelId) {
            if (!bot.config.bot.autoLeave.enabled && bot.config.bot.voiceStatusIdleText) {
                await setIdleVoiceStatus(bot, client, player.voiceChannelId);
            } else {
                await setVoiceChannelStatus(bot, client, player.voiceChannelId, null);
            }
        }

        // Stop periodic save and delete persisted queue since queue has ended
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            (client as any).queuePersistence.stopPeriodicSave(player.guildId);
            (client as any).queuePersistence.deleteQueue(player.guildId);
        }

        await client.dashboard.destroy(player);

        if (bot.config.bot.autoLeave.enabled) {
            player.destroy();
        }
    }
}
