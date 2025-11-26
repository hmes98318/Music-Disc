import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackStart event handler
 * Updates dashboard when a track starts playing
 */
export class TrackStartEvent extends BaseLavaSharkEvent<'trackStart'> {
    public getEventName(): 'trackStart' {
        return 'trackStart';
    }

    public async execute(_bot: Bot, client: Client, player: Player): Promise<void> {
        const track = player.current;
        await client.dashboard.update(player, track!);
    }
}
