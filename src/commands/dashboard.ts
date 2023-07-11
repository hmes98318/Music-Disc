import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { dashboard } from "../dashboard";


export const name = 'dashboard';
export const aliases = ['d', 'console'];
export const description = 'Move the dashboard embed to the bottom';
export const usage = 'dashboard';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.dashboard) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboard?.delete();
    } catch (error) {
        console.log('Dashboard delete error:', error);
    }

    await dashboard.initial(client, message, player);
    await dashboard.update(client, player, player.current!);
    return message.react('👍');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.dashboard) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboard?.delete();
    } catch (error) {
        console.log('Dashboard delete error:', error);
    }

    await dashboard.initial(client, interaction, player);
    await dashboard.update(client, player, player.current!);
    return interaction.editReply("✅ | Dashboard updated.");
}