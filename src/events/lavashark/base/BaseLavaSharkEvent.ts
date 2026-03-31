import type { Client } from 'discord.js';
import type { LavaSharkEvents } from 'lavashark/typings/src/@types/LavaShark.types.js';
import type { Bot } from '../../../@types/index.js';


/**
 * Base class for all LavaShark events
 * Provides a unified structure for LavaShark event handling
 */
export abstract class BaseLavaSharkEvent<K extends keyof LavaSharkEvents = keyof LavaSharkEvents> {
    /**
     * Get the LavaShark event name
     */
    public abstract getEventName(): K;

    /**
     * Execute the event handler
     * @param bot Bot instance
     * @param client Discord client
     * @param args Event arguments from LavaShark
     */
    public abstract execute(bot: Bot, client: Client, ...args: Parameters<LavaSharkEvents[K]>): Promise<void> | void;
}
