import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Player, Track } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackEnd event handler
 * Currently does nothing, placeholder for future functionality
 */
export class TrackEndEvent extends BaseLavaSharkEvent<'trackEnd'> {
    public getEventName(): 'trackEnd' {
        return 'trackEnd';
    }

    public async execute(_bot: Bot, _client: Client, _player: Player, _track: Track, _reason: any): Promise<void> {
        // Currently no action needed
    }
}
