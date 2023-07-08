import { ChatInputCommandInteraction, Client, Message } from "discord.js";


export const name = 'shuffle';
export const aliases = ['random'];
export const description = 'Shuffle Playlist';
export const usage = 'shuffle';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    player.queue.shuffle();
    return message.react('👍');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    player.queue.shuffle();
    return interaction.editReply('✅ | Music shuffled.');
}