import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    Message
} from "discord.js";
import { embeds } from "../embeds";

import type { Bot } from "../@types";


export const name = 'nowplaying';
export const aliases = ['np', 'save'];
export const description = 'Show now playing song';
export const usage = 'nowplaying';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const track = player.current;
    const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

    const saveButton = new ButtonBuilder()
        .setCustomId('musicSave')
        .setLabel('Save Song')
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(saveButton);

    return message.channel.send({
        embeds: [embeds.save(bot.config.embedsColor, track!.title, subtitle, track!.uri, track!.thumbnail!)],
        components: [row],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const track = player.current;
    const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

    const saveButton = new ButtonBuilder()
        .setCustomId('musicSave')
        .setLabel('Save Song')
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(saveButton);

    return interaction.editReply({
        embeds: [embeds.save(bot.config.embedsColor, track!.title, subtitle, track!.uri, track!.thumbnail!)],
        components: [row],
        allowedMentions: { repliedUser: false }
    });
};