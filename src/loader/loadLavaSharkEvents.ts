import { LavaSharkEventRegistry } from '../events/lavashark/base/LavaSharkEventRegistry.js';
import { registerAllLavaSharkEvents } from '../events/lavashark/index.js';
import { cst } from '../utils/constants.js';

import type { Client } from 'discord.js';
import type { Bot } from '../@types/index.js';


/**
 * Load and register all LavaShark events
 * Uses the registry pattern to manage event handlers
 * 
 * @param bot Bot instance
 * @param client Discord client instance
 */
const loadLavaSharkEvents = (bot: Bot, client: Client): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            bot.logger.emit('log', bot.shardId, `-> loading LavaShark Events ......`);

            // Create registry and register all events
            const registry = new LavaSharkEventRegistry();
            registerAllLavaSharkEvents(registry, bot);

            // Get all events and register listeners
            const events = registry.getAll();

            bot.logger.emit('log', bot.shardId, `+--------------------------------+`);

            // Register each event with LavaShark
            for (const event of events) {
                const eventName = event.getEventName();

                // Bind the event handler to LavaShark
                client.lavashark.on(eventName, event.execute.bind(event, bot, client));

                bot.logger.emit('log', bot.shardId, `| Loaded event ${eventName.padEnd(17, ' ')} |`);
            }

            bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
            bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading LavaShark Events finished --${cst.color.white}`);

            resolve();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `Failed to load LavaShark events: ${error}`);
            reject(error);
        }
    });
};

export { loadLavaSharkEvents };
