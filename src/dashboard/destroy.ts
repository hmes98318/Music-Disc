import { Client } from "discord.js";
import { Player } from "lavashark";

import { embeds } from "../embeds";


async function destroy(client: Client, player: Player) {
    await player.dashboard!.edit({
        embeds: [embeds.disconnect(client.config.embedsColor)],
        components: []
    });

    player.dashboard = null;
    return;
}

export { destroy };