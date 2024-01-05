import { embeds } from "../embeds";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


export const name = 'ping';
export const aliases = [];
export const description = 'Get server ping';
export const usage = 'ping';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const botPing = `${Date.now() - message.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    await message.react('👍');

    return message.reply({
        embeds: [embeds.ping(bot.config.embedsColor, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    return interaction.editReply({
        embeds: [embeds.ping(bot.config.embedsColor, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
};