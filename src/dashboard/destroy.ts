import { Player } from "lavashark";
import { embeds } from "../embeds";


async function destroy(player: Player, embedsColor: string | number) {
    try {
        await player.dashboard!.edit({
            embeds: [embeds.disconnect(embedsColor)],
            components: []
        });
    } catch (error) {
        console.log('Dashboard error:', error);
    }
    finally {
        player.dashboard = null;
    }
}

export { destroy };