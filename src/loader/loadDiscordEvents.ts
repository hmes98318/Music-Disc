import { DiscordEventRegistry } from '../events/discord/base/DiscordEventRegistry.js';
import { registerAllDiscordEvents } from '../events/discord/index.js';
import { cst } from '../utils/constants.js';

import type { Client } from 'discord.js';
import type { Bot } from '../@types/index.js';


const loadDiscordEvents = async (bot: Bot, client: Client): Promise<void> => {
    bot.logger.emit('log', bot.shardId, `-> loading Discord Events ......`);

    // Create event registry
    const registry = new DiscordEventRegistry();

    // Register all events
    registerAllDiscordEvents(registry, bot);

    // Get all events and register listeners
    const events = registry.getAll();

    bot.logger.emit('log', bot.shardId, `+--------------------------------+`);

    for (const event of events) {
        const eventName = event.getEventName();

        // Register event listener
        client.on(eventName as any, event.execute.bind(event, bot, client));

        bot.logger.emit('log', bot.shardId, `| Loaded event ${eventName.padEnd(17, ' ')} |`);
    }

    bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
    bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading Discord Events finished --${cst.color.white}`);
};

export { loadDiscordEvents };