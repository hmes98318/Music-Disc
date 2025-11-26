import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * PlayerDestroy event handler
 * Logs when a player is destroyed and cleans up dashboard
 */
export class PlayerDestroyEvent extends BaseLavaSharkEvent<'playerDestroy'> {
    public getEventName(): 'playerDestroy' {
        return 'playerDestroy';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        bot.logger.emit('lavashark', bot.shardId, `[playerDestroy] Player destroyed in guild "${player.guildId}"`);

        // Clean up dashboard message
        if (player.dashboardMsg) {
            await client.dashboard.destroy(player);
        }
    }
}
