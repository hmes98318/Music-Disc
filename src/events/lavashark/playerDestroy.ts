import { Client } from "discord.js";
import { Player } from "lavashark";

import { dashboard } from "../../dashboard";


export default async (client: Client, player: Player) => {
    console.log('// -------- player Destroy -------- //');

    await dashboard.destroy(client, player);
};