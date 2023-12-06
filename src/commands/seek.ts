import { timeToSeconds } from "../utils/functions/unitConverter";

import type { ChatInputCommandInteraction, Client, Message } from "discord.js";
import type { Bot } from "../@types";


export const name = 'seek';
export const aliases = [];
export const description = 'Seeks to a certain time in the track';
export const usage = 'seek <[hh]mm]ss/[hh:mm]:ss> (ex: 3m20s, 1:20:55)';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "seek",
        description: "traget time (ex: 3m20s, 1:20:55)",
        type: 3,
        required: true
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const str = args.join(' ');
    const tragetTime = timeToSeconds(str);

    if (!tragetTime) {
        return message.reply({ content: `❌ | Invalid format for the target time.\n(**\`ex: 3m20s, 1m 50s, 1:20:55, 5:20\`**)`, allowedMentions: { repliedUser: false } });
    }

    const tragetTimeMs = tragetTime * 1000;

    await message.react('👍');
    await player.seek(tragetTimeMs);

    if (tragetTimeMs >= player.current!.duration.value) {
        return message.reply({ content: `✅ | The seek position is beyond the duration of this track. (\`${player.current!.duration.label}\`)\nSkipping to the next song.`, allowedMentions: { repliedUser: false } });
    }
    else {
        return message.reply({ content: `✅ | Music has been seeked to \`${str}\`.`, allowedMentions: { repliedUser: false } });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const str = interaction.options.getString("seek");
    const tragetTime = timeToSeconds(str!);

    if (!tragetTime) {
        return interaction.editReply({ content: `❌ | Invalid format for the target time.\n(**\`ex: 3m20s, 1m 50s, 1:20:55, 5:20\`**)`, allowedMentions: { repliedUser: false } });
    }

    const tragetTimeMs = tragetTime * 1000;

    await player.seek(tragetTimeMs);

    if (tragetTimeMs >= player.current!.duration.value) {
        return interaction.editReply({ content: `✅ | The seek position is beyond the duration of this track. (\`${player.current!.duration.label}\`)\nSkipping to the next song.`, allowedMentions: { repliedUser: false } });
    }
    else {
        return interaction.editReply({ content: `✅ | Music has been seeked to \`${str}\`.`, allowedMentions: { repliedUser: false } });
    }

};