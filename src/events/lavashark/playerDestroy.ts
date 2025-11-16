import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (_bot: Bot, client: Client, player: Player) => {
    if (player.dashboardMsg) await client.dashboard.destroy(player);
};