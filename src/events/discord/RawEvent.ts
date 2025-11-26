import { Events } from 'discord.js';

import { BaseDiscordEvent } from './base/BaseDiscordEvent.js';

import type { Client } from 'discord.js';
import type { IncomingDiscordPayload } from 'lavashark/typings/src/@types/LavaShark.types.js';
import type { Bot } from '../../@types/index.js';


/**
 * Raw event handler for voice updates
 * Forwards raw Discord packets to LavaShark for voice state management
 */
export class RawEvent extends BaseDiscordEvent<Events.Raw> {
    public getEventName(): Events.Raw {
        return Events.Raw;
    }

    public execute(_bot: Bot, client: Client, packet: unknown): void {
        client.lavashark.handleVoiceUpdate(packet as IncomingDiscordPayload);
    }
}
