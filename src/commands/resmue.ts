import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'resume';
export const aliases = [];
export const description = i18next.t('commands:CONFIG_RESUME_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_RESUME_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    if (!player.paused) {
        return message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_RESUME_MUSIC_RESUMED'))], allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.resume();
    return SUCCESS ? message.react('▶️') : message.react('❌');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    if (!player.paused) {
        return interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_RESUME_MUSIC_RESUMED'))], allowedMentions: { repliedUser: false } });
    }

    const SUCCESS = await player.resume();
    return SUCCESS
        ? interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_RESUME_SUCCESS'))], allowedMentions: { repliedUser: false } })
        : interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_RESUME_FAIL'))], allowedMentions: { repliedUser: false } });
};