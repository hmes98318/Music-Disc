import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Node } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Error event handler
 * Logs errors that occur with Lavalink nodes
 */
export class ErrorEvent extends BaseLavaSharkEvent<'error'> {
    public getEventName(): 'error' {
        return 'error';
    }

    public execute(bot: Bot, _client: Client, node: Node, error: any): void {
        // `node` can be null at runtime: lavashark may emit 'error' after the
        // node was detached from a destroyed player
        bot.logger.error(
            bot.shardId,
            `[LavaShark] ${node?.identifier ?? 'unknown'} error: ${error?.message ?? error}`,
        );
    }
}
