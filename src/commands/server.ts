import { embeds } from "../embeds";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


export const name = 'server';
export const aliases = [];
export const description = 'Show currently active servers';
export const usage = 'server';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = false;
export const requireAdmin = true;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const serverlist = client.guilds.cache
        .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
        .join('\n\n');

    return message.reply({
        embeds: [embeds.server(bot.config, serverlist)],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const serverlist = client.guilds.cache
        .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
        .join('\n\n');

    return interaction.editReply({
        embeds: [embeds.server(bot.config, serverlist)],
        allowedMentions: { repliedUser: false }
    });
};