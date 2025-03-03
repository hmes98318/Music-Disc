import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'clear';
export const aliases = ['cls'];
export const description = 'Clear all the music in the queue';
export const usage = 'clear';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (_bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    player.queue.clear();
    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    player.queue.clear();
    return interaction.editReply(client.i18n.t('commands:MESSAGE_CLEAR_SUCCESS'));
};