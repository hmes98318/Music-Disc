import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { dashboard } from "../dashboard";


export const name = 'leave';
export const aliases = ['stop'];
export const description = 'Leave current voice channel';
export const usage = 'leave';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    if (client.config.autoLeave) {
        await player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(player, client.config.embedsColor);
    }

    return message.react('👍');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    if (client.config.autoLeave) {
        await player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(player, client.config.embedsColor);
    }

    return interaction.editReply('✅ | Bot leave.');
}