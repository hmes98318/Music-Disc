import { embeds } from "../embeds";

import type { Player } from "lavashark";
import type { Bot } from "../@types";


async function destroy(bot: Bot, player: Player, embedsColor: string | number) {
    try {
        await player.dashboard!.edit({
            embeds: [embeds.disconnect(embedsColor)],
            components: []
        });
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Dashboard error: ' + error);
    }
    finally {
        player.dashboard = null;
    }
}

export { destroy };