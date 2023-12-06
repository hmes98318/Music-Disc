import { dashboard } from "../dashboard";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


export const name = 'dashboard';
export const aliases = ['d', 'console'];
export const description = 'Move the dashboard embed to the bottom';
export const usage = 'dashboard';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.dashboard) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboard?.delete();
    } catch (error) {
        bot.logger.emit('error', 'Dashboard delete error:', error);
    }

    await dashboard.initial(bot, message, player);
    await dashboard.update(bot, player, player.current!);
    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.dashboard) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboard?.delete();
    } catch (error) {
        bot.logger.emit('error', 'Dashboard delete error:', error);
    }

    await dashboard.initial(bot, interaction, player);
    await dashboard.update(bot, player, player.current!);
    return interaction.editReply("✅ | Dashboard updated.");
};