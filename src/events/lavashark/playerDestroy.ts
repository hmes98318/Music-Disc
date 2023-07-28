import { Client } from "discord.js";
import { Player } from "lavashark";

import { dashboard } from "../../dashboard";


export default async (client: Client, player: Player) => {
    await dashboard.destroy(player, client.config.embedsColor);
};