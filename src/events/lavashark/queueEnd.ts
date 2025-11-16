import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client, player: Player) => {
    if (bot.config.bot.autoLeave.enabled) {
        await player.destroy();
    }

    await client.dashboard.destroy(player);
};