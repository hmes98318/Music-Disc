import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * QueueEnd event handler
 * Handles auto-leave and dashboard cleanup when queue ends
 */
export class QueueEndEvent extends BaseLavaSharkEvent<'queueEnd'> {
    public getEventName(): 'queueEnd' {
        return 'queueEnd';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        if (bot.config.bot.autoLeave.enabled) {
            player.destroy();
        }

        await client.dashboard.destroy(player);
    }
}
