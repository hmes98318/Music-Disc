import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


export default async (_bot: Bot, client: Client, player: Player/*, track: Track*/) => {
    // bot.logger.emit('lavashark', '// -------- track start -------- //');

    const track = player.current; //--------------------------
    await client.dashboard.update(player, track!);
};