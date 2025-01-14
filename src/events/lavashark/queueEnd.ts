import { dashboard } from '../../dashboard/index.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, _client: Client, player: Player) => {
    if (bot.config.bot.autoLeave.enabled) {
        await player.destroy();
    }

    await dashboard.destroy(bot, player);
};