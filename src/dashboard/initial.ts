import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    Message
} from "discord.js";
import { Player } from "lavashark";

import { cst } from "../utils/constants";
import { embeds } from "../embeds";


async function initial(client: Client, message: Message, player: Player): Promise<void>;
async function initial(client: Client, interaction: ChatInputCommandInteraction, player: Player): Promise<void>;
async function initial(client: Client, interactionOrMessage: ChatInputCommandInteraction | Message, player: Player): Promise<void> {
    let channel;

    if (interactionOrMessage instanceof Message) {
        channel = (interactionOrMessage as Message).channel;
    }
    else if (interactionOrMessage instanceof ChatInputCommandInteraction) {
        channel = (interactionOrMessage as ChatInputCommandInteraction).channel;
    }
    else {
        throw TypeError("Invalid Interaction or Message type");
    }

    const playPauseButton = new ButtonBuilder().setCustomId('Dashboard-PlayPause').setEmoji(cst.button.pause).setStyle(ButtonStyle.Secondary);
    const skipButton = new ButtonBuilder().setCustomId('Dashboard-Skip').setEmoji(cst.button.skip).setStyle(ButtonStyle.Secondary);
    const stopButton = new ButtonBuilder().setCustomId('Dashboard-Stop').setEmoji(cst.button.stop).setStyle(ButtonStyle.Danger);
    const loopButton = new ButtonBuilder().setCustomId('Dashboard-Loop').setEmoji(cst.button.loop).setStyle(ButtonStyle.Secondary);
    const shuffleButton = new ButtonBuilder().setCustomId('Dashboard-Shuffle').setEmoji(cst.button.shuffle).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);

    player.dashboard = await channel!.send({
        embeds: [embeds.connected(client.config.embedsColor)],
        components: [row]
    });
}

export { initial };