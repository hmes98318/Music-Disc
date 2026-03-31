import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { setIdleVoiceStatus } from '../../utils/functions/setVoiceStatus.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * PlayerConnect event handler
 * Logs when a player connects to a voice channel
 */
export class PlayerConnectEvent extends BaseLavaSharkEvent<'playerConnect'> {
    public getEventName(): 'playerConnect' {
        return 'playerConnect';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        bot.logger.emit('lavashark', bot.shardId, `[playerConnect] Player connected in guild "${player.guildId}"`);

        // Set idle voice status when bot connects
        if (player.voiceChannelId) {
            await setIdleVoiceStatus(bot, client, player.voiceChannelId);
        }
    }
}
