import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { embeds } from "../embeds";


export const name = 'ping';
export const aliases = [];
export const description = 'Get server ping';
export const usage = 'ping';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const botPing = `${Date.now() - message.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    await message.react('👍');

    return message.reply({
        embeds: [embeds.ping(client.config.embedsColor, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    return interaction.editReply({
        embeds: [embeds.ping(client.config.embedsColor, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
}