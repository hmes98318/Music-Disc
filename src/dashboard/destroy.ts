import { Client } from "discord.js";
import { Player } from "lavashark";

import { embeds } from "../embeds";


async function destroy(client: Client, player: Player) {
    try {
        await player.dashboard!.edit({
            embeds: [embeds.disconnect(client.config.embedsColor)],
            components: []
        });
    } catch (error) {
        console.log('Dashboard error:', error);
    }

    player.dashboard = null;
    return;
}

export { destroy };