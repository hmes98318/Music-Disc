import type { BaseLavaSharkEvent } from './BaseLavaSharkEvent.js';
import type { LavaSharkEvents } from 'lavashark/typings/src/@types/LavaShark.types.js';


/**
 * Registry for managing LavaShark event instances
 * Provides centralized storage and retrieval of event handlers
 */
export class LavaSharkEventRegistry {
    #events: Map<keyof LavaSharkEvents, BaseLavaSharkEvent>;

    constructor() {
        this.#events = new Map();
    }

    /**
     * Register a LavaShark event instance
     * @param event Event instance to register
     */
    public register(event: BaseLavaSharkEvent): void {
        const eventName = event.getEventName();
        this.#events.set(eventName, event);
    }

    /**
     * Get a specific event by name
     * @param eventName Name of the event
     * @returns Event instance or undefined
     */
    public get(eventName: keyof LavaSharkEvents): BaseLavaSharkEvent | undefined {
        return this.#events.get(eventName);
    }

    /**
     * Get all registered events
     * @returns Array of all event instances
     */
    public getAll(): BaseLavaSharkEvent[] {
        return Array.from(this.#events.values());
    }
}
