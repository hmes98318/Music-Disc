import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Node } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * NodeResume event handler
 * Logs when a Lavalink node resumes after reconnection
 */
export class NodeResumeEvent extends BaseLavaSharkEvent<'nodeResume'> {
    public getEventName(): 'nodeResume' {
        return 'nodeResume';
    }

    public execute(bot: Bot, _client: Client, node: Node): void {
        bot.logger.emit('lavashark', bot.shardId, `[nodeResume] Node "${node.identifier}" resumed!`);
    }
}
