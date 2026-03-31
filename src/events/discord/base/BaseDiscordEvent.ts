import { Events } from 'discord.js';

import type { Client, ClientEvents } from 'discord.js';
import type { Bot } from '../../../@types/index.js';


/**
 * Base class for all Discord events
 * Provides a unified structure for event handling
 */
export abstract class BaseDiscordEvent<DiscordEvents extends Events = Events> {
    /**
     * Get the Discord.js event name
     */
    abstract getEventName(): DiscordEvents;

    /**
     * Execute the event handler
     * @param bot Bot instance
     * @param client Discord client
     * @param args Event arguments from Discord.js
     */
    public abstract execute(bot: Bot, client: Client, ...args: DiscordEvents extends keyof ClientEvents ? ClientEvents[DiscordEvents] : any[]): Promise<void> | void;
}
