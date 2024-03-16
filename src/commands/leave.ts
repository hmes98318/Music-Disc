import { dashboard } from "../dashboard";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


export const name = 'leave';
export const aliases = ['stop'];
export const description = 'Leave current voice channel';
export const usage = 'leave';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const requireAdmin = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    if (bot.config.autoLeave) {
        player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(bot, player, bot.config.embedsColor);
    }

    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    if (bot.config.autoLeave) {
        player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(bot, player, bot.config.embedsColor);
    }

    return interaction.editReply('✅ | Bot leave.');
};