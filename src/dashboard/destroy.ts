import { embeds } from '../embeds/index.js';

import type { Player } from 'lavashark';
import type { Bot } from '../@types/index.js';


async function destroy(bot: Bot, player: Player) {
    try {
        await player.dashboard!.edit({
            embeds: [embeds.disconnect(bot)],
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