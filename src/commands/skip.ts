import { ChatInputCommandInteraction, Client, Message } from "discord.js";


export const name = 'skip';
export const aliases = ['s'];
export const description = 'Skip currnet track';
export const usage = 'leave'
export const voiceChannel = true;
export const showHelp = true;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.skip();
    return SUCCESS ? message.react('👍') : message.react('❌');
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.skip();
    return SUCCESS ? interaction.reply('✅ | Music skipped.') : interaction.reply('❌ | Music skip failed.');
}