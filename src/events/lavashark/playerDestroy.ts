import { dashboard } from '../../dashboard/index.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, _client: Client, player: Player) => {
    if (player.leaveTimeout) {
        clearTimeout(player.leaveTimeout);
        player.leaveTimeout = undefined;
    }

    if (player.dashboard) await dashboard.destroy(bot, player);
};