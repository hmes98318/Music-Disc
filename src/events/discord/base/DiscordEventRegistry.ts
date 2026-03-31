import { BaseDiscordEvent } from './BaseDiscordEvent.js';
import type { Bot } from '../../../@types/index.js';


/**
 * Discord event registry for managing all Discord events
 */
export class DiscordEventRegistry {
    #events = new Map<string, BaseDiscordEvent>();

    /**
     * Register an event
     */
    public register(event: BaseDiscordEvent, _bot: Bot): void {
        const eventName = event.getEventName();

        // Register event
        this.#events.set(eventName, event);
    }

    /**
     * Get event by name
     */
    public get(eventName: string): BaseDiscordEvent | undefined {
        return this.#events.get(eventName);
    }

    /**
     * Check if event exists
     */
    public has(eventName: string): boolean {
        return this.#events.has(eventName);
    }

    /**
     * Get all registered events
     */
    public getAll(): BaseDiscordEvent[] {
        return Array.from(this.#events.values());
    }

    /**
     * Get all event names
     */
    public getAllNames(): string[] {
        return Array.from(this.#events.keys());
    }
}
