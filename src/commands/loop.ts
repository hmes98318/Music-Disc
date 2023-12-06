import { RepeatMode } from "lavashark";

import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import type { Bot } from "../@types";


export const name = 'loop';
export const aliases = ['lp'];
export const description = 'Turns the music loop mode on or off';
export const usage = 'loop <off/one/all>';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "mode",
        description: "The loop mode",
        type: 3,
        required: true,
        choices: [
            {
                name: "Off",
                value: "off"
            },
            {
                name: "One",
                value: "one"
            },
            {
                name: "All",
                value: "all"
            }
        ]
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    let mode = null;
    const methods = ['Off', 'Single', 'All'];

    if (!args[0]) return message.reply({ content: `❌ | ${bot.config.prefix}${usage}`, allowedMentions: { repliedUser: false } });

    switch (args[0].toLowerCase()) {
        case 'off': {
            mode = 0;
            player.setRepeatMode(RepeatMode.OFF);
            break;
        }
        case 'one' || 'single': {
            mode = 1;
            player.setRepeatMode(RepeatMode.TRACK);
            break;
        }
        case 'all' || 'queue': {
            mode = 2;
            player.setRepeatMode(RepeatMode.QUEUE);
            break;
        }
        default: {
            return message.reply({ content: `❌ | ${bot.config.prefix}${usage}`, allowedMentions: { repliedUser: false } });
        }
    }

    await message.react('👍');
    return message.reply({ content: `Set loop to \`${methods[mode]}\``, allowedMentions: { repliedUser: false } });
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    let mode = null;
    const methods = ['Off', 'Single', 'All'];

    switch (interaction.options.getString("mode")) {
        case 'off': {
            mode = 0;
            player.setRepeatMode(RepeatMode.OFF);
            break;
        }
        case 'one': {
            mode = 1;
            player.setRepeatMode(RepeatMode.TRACK);
            break;
        }
        case 'all': {
            mode = 2;
            player.setRepeatMode(RepeatMode.QUEUE);
            break;
        }
        default: {
            return interaction.editReply({ content: `❌ | ${bot.config.prefix}${usage}`, allowedMentions: { repliedUser: false } });
        }
    }

    return interaction.editReply({ content: `Set loop to \`${methods[mode!]}\``, allowedMentions: { repliedUser: false } });
};