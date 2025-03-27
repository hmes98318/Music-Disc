import i18next from 'i18next';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'pause';
export const aliases = [];
export const description = i18next.t('commands:CONFIG_PAUSE_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_PAUSE_USAGE');
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (_bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    if (player.paused) {
        return message.reply({ content: client.i18n.t('commands:MESSAGE_PAUSE_MUSIC_PAUSED'), allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.pause();
    return SUCCESS ? message.react('⏸️') : message.react('❌');
};

export const slashExecute = async (_bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    if (player.paused) {
        return interaction.editReply({ content: client.i18n.t('commands:MESSAGE_PAUSE_MUSIC_PAUSED'), allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.pause();
    return SUCCESS ? interaction.editReply(client.i18n.t('commands:MESSAGE_PAUSE_SUCCESS')) : interaction.editReply(client.i18n.t('commands:MESSAGE_PAUSE_FAIL'));
};