import { Client } from "discord.js";
import { Player } from "lavashark";

import { dashboard } from "../../dashboard";


export default async (client: Client, player: Player) => {
    console.log('// -------- queue end -------- //');

    if (client.config.autoLeave) {
        await player.destroy();
    }
    else {
        await dashboard.destroy(client, player);
    }
};