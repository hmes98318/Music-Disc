import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Node } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * NodeDisconnect event handler
 * Logs when a Lavalink node disconnects
 */
export class NodeDisconnectEvent extends BaseLavaSharkEvent<'nodeDisconnect'> {
    public getEventName(): 'nodeDisconnect' {
        return 'nodeDisconnect';
    }

    public execute(bot: Bot, _client: Client, node: Node): void {
        bot.logger.emit('lavashark', bot.shardId, `[nodeDisconnect] Node "${node.identifier}" disconnected!`);
    }
}
