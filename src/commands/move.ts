import {
    ChatInputCommandInteraction,
    Client,
    Message
} from "discord.js";
import type { Bot } from "../@types";


export const name = 'move';
export const aliases = ['mv', 'swap', 'change'];
export const description = 'Swap the positions of two songs in the queue';
export const usage = 'move <index1> <index2>';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "moveindex1",
        description: "To swap song position 1",
        type: 4,
        required: true,
        min_value: 1
    },
    {
        name: "moveindex2",
        description: "To swap song position 2",
        type: 4,
        required: true,
        min_value: 1
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    if (!player.queue.size) {
        return message.reply({ content: '❌ | There is currently no music to be play in the queue.', allowedMentions: { repliedUser: false } });
    }


    const index1 = parseInt(args[0], 10);
    const index2 = parseInt(args[1], 10);

    if (isNaN(index1) || isNaN(index2)) {
        return message.reply({ content: `❌ | Please enter a valid index range. (1 - ${player.queue.size})`, allowedMentions: { repliedUser: false } });
    }


    const isSuccess = player.queue.move(index1 - 1, index2 - 1);

    if (!isSuccess) {
        return message.reply({ content: `❌ | Please enter a valid index range. (1 - ${player.queue.size})`, allowedMentions: { repliedUser: false } });
    }


    return message.react('👍');
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    if (!player.queue.size) {
        return interaction.editReply({ content: '❌ | There is currently no music to be play in the queue.', allowedMentions: { repliedUser: false } });
    }


    const index1 = Math.floor(interaction.options.getInteger("moveindex1")!);
    const index2 = Math.floor(interaction.options.getInteger("moveindex2")!);

    const isSuccess = player.queue.move(index1 - 1, index2 - 1);

    if (!isSuccess) {
        return interaction.editReply({ content: `❌ | Please enter a valid index range. (1 - ${player.queue.size})`, allowedMentions: { repliedUser: false } });
    }


    return interaction.editReply({ content: `✅ | Song order exchange successful.`, allowedMentions: { repliedUser: false } });
};