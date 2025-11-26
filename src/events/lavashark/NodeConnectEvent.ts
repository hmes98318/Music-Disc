import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Node } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * NodeConnect event handler
 * Logs when a Lavalink node connects successfully
 */
export class NodeConnectEvent extends BaseLavaSharkEvent<'nodeConnect'> {
    public getEventName(): 'nodeConnect' {
        return 'nodeConnect';
    }

    public execute(bot: Bot, _client: Client, node: Node): void {
        bot.logger.emit('lavashark', bot.shardId, `[nodeConnect] Node "${node.identifier}" connected!`);
    }
}
