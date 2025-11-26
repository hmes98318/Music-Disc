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
        bot.logger.emit('error', bot.shardId, `[LavaShark] ${node.identifier} error: ${error.message}`);
    }
}
