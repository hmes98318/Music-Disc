import { dashboard } from "../../dashboard";

import type { Client } from "discord.js";
import type { Player } from "lavashark";
import type { Bot } from "../../@types";


export default async (bot: Bot, _client: Client, player: Player/*, track: Track*/) => {
    // bot.logger.emit('lavashark', '// -------- track start -------- //');

    const track = player.current; //--------------------------
    await dashboard.update(bot, player, track!);
};