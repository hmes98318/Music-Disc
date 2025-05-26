import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { timeToSeconds } from '../utils/functions/unitConverter.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'seek';
export const aliases = [];
export const description = i18next.t('commands:CONFIG_SEEK_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_SEEK_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'seek',
        description: i18next.t('commands:CONFIG_SEEK_OPTION_DESCRIPTION'),
        type: 3,
        required: true
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const str = args.join(' ');
    const tragetTime = timeToSeconds(str);

    if (!tragetTime) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_ARGS_ERROR'))], allowedMentions: { repliedUser: false } });
    }

    const tragetTimeMs = tragetTime * 1000;

    await message.react('👍');
    await player.seek(tragetTimeMs);

    if (tragetTimeMs >= player.current!.duration.value) {
        return message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_SKIP', { duration: player.current!.duration.label }))], allowedMentions: { repliedUser: false } });
    }
    else {
        return message.reply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_SUCCESS', { duration: str }))], allowedMentions: { repliedUser: false } });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const str = interaction.options.getString('seek');
    const tragetTime = timeToSeconds(str!);

    if (!tragetTime) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_ARGS_ERROR'))], allowedMentions: { repliedUser: false } });
    }

    const tragetTimeMs = tragetTime * 1000;

    await player.seek(tragetTimeMs);

    if (tragetTimeMs >= player.current!.duration.value) {
        return interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_SKIP', { duration: player.current!.duration.label }))], allowedMentions: { repliedUser: false } });
    }
    else {
        return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_SEEK_SUCCESS', { duration: str }))], allowedMentions: { repliedUser: false } });
    }
};