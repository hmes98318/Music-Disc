import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * PlayerConnect event handler
 * Logs when a player connects to a voice channel
 */
export class PlayerConnectEvent extends BaseLavaSharkEvent<'playerConnect'> {
    public getEventName(): 'playerConnect' {
        return 'playerConnect';
    }

    public execute(bot: Bot, _client: Client, player: Player): void {
        bot.logger.emit('lavashark', bot.shardId, `[playerConnect] Player connected in guild "${player.guildId}"`);
    }
}
