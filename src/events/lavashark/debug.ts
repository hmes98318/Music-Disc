import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';

    
export default async (bot: Bot, _client: Client, message: string) => {
    bot.logger.emit('lavashark', bot.shardId, `[debug] ${message}`);
};