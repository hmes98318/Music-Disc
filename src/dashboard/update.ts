import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
} from "discord.js";
import { Player, Track } from "lavashark";

import { cst } from "../utils/constants";
import { embeds } from "../embeds";


async function update(client: Client, player: Player, track: Track): Promise<void> {
    const playing = !(player.paused);
    const methods = ['Off', 'Single', 'All'];
    const repeatMode = player.repeatMode;
    const volume = player.volume;
    const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`
                    + `────────────────────\n`
                    + `Volume: \`${volume}%\` | Loop: \`${methods[repeatMode]}\``;

    const playPauseButton = new ButtonBuilder().setCustomId('Dashboard-PlayPause').setEmoji(playing ? cst.button.pause : cst.button.play).setStyle(playing ? ButtonStyle.Secondary : ButtonStyle.Success);
    const skipButton = new ButtonBuilder().setCustomId('Dashboard-Skip').setEmoji(cst.button.skip).setStyle(ButtonStyle.Secondary);
    const stopButton = new ButtonBuilder().setCustomId('Dashboard-Stop').setEmoji(cst.button.stop).setStyle(ButtonStyle.Danger);
    const loopButton = new ButtonBuilder().setCustomId('Dashboard-Loop').setEmoji(cst.button.loop).setStyle(ButtonStyle.Secondary);
    const shuffleButton = new ButtonBuilder().setCustomId('Dashboard-Shuffle').setEmoji(cst.button.shuffle).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);

    await player.dashboard!.edit({
        embeds: [embeds.dashboard(client.config.embedsColor, 'Dashboard', track!.title, subtitle, track!.uri, track!.thumbnail!)],
        components: [row]
    });
}

export { update };