import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

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
        // Delete persisted queue since queue has ended
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            (client as any).queuePersistence.deleteQueue(player.guildId);
        }

        if (bot.config.bot.autoLeave.enabled) {
            player.destroy();
        }

        await client.dashboard.destroy(player);
    }
}
