import { dashboard } from '../../dashboard/index.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, _client: Client, player: Player/*, track: Track*/) => {
    // bot.logger.emit('lavashark', '// -------- track start -------- //');

    const track = player.current; //--------------------------
    await dashboard.update(bot, player, track!);
};