import { ChatInputCommandInteraction, Message } from "discord.js";
import { embeds } from "../embeds";

import type { Player } from "lavashark";
import type { Bot } from "../@types";


async function initial(bot: Bot, message: Message, player: Player): Promise<void>;
async function initial(bot: Bot, interaction: ChatInputCommandInteraction, player: Player): Promise<void>;
async function initial(bot: Bot, interactionOrMessage: ChatInputCommandInteraction | Message, player: Player): Promise<void> {
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

    player.dashboard = await (channel as any /* discord.js type error ? (v14.16.2) */).send({
        embeds: [embeds.connected(bot.config.embedsColor)],
        components: []
    });
}

export { initial };