import { Client } from "discord.js";
import { Player, Track } from "lavashark";

import { dashboard } from "../../dashboard";


export default async (client: Client, player: Player/*, track: Track*/) => {
    // console.log('// -------- track start -------- //');

    const track = player.current; //--------------------------
    await dashboard.update(client, player, track!);
};