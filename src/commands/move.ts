import {
    ChatInputCommandInteraction,
    Client,
    Message
} from 'discord.js';
import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { Bot } from '../@types/index.js';


export const name = 'move';
export const aliases = ['mv', 'swap', 'change'];
export const description = i18next.t('commands:CONFIG_MOVE_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_MOVE_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'moveindex1',
        description: i18next.t('commands:CONFIG_MOVE_OPTION_DESCRIPTION'),
        type: 4,
        required: true,
        min_value: 1
    },
    {
        name: 'moveindex2',
        description: i18next.t('commands:CONFIG_MOVE_OPTION_DESCRIPTION_2'),
        type: 4,
        required: true,
        min_value: 1
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    if (!player.queue.size) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_MUSIC_IN_QUEUE'))], allowedMentions: { repliedUser: false } });
    }


    const index1 = parseInt(args[0], 10);
    const index2 = parseInt(args[1], 10);

    if (isNaN(index1) || isNaN(index2)) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_MOVE_WRONG_INDEX', { max: player.queue.size }))], allowedMentions: { repliedUser: false } });
    }


    const isSuccess = player.queue.move(index1 - 1, index2 - 1);

    if (!isSuccess) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_MOVE_WRONG_INDEX', { max: player.queue.size }))], allowedMentions: { repliedUser: false } });
    }


    return message.react('👍');
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    if (!player.queue.size) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_MUSIC_IN_QUEUE'))], allowedMentions: { repliedUser: false } });
    }


    const index1 = Math.floor(interaction.options.getInteger('moveindex1')!);
    const index2 = Math.floor(interaction.options.getInteger('moveindex2')!);

    const isSuccess = player.queue.move(index1 - 1, index2 - 1);

    if (!isSuccess) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_MOVE_WRONG_INDEX', { max: player.queue.size }))], allowedMentions: { repliedUser: false } });
    }


    return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_MOVE_SUCCESS'))], allowedMentions: { repliedUser: false } });
};