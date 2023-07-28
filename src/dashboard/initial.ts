import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { Player } from "lavashark";

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
        throw new TypeError("Invalid Interaction or Message type");
    }

    player.dashboard = await channel!.send({
        embeds: [embeds.connected(client.config.embedsColor)],
        components: []
    });
}

export { initial };