import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { dashboard } from '../dashboard/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'volume';
export const aliases = ['v'];
export const description = i18next.t('commands:CONFIG_VOLUME_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_VOLUME_USAGE');
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'volume',
        description: i18next.t('commands:CONFIG_VOLUME_OPTION_DESCRIPTION'),
        type: 4,
        required: true,
        min_value: 1
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const maxVolume = bot.config.bot.volume.max;
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    await message.react('👍');
    const vol = parseInt(args[0], 10);

    if (!vol) {
        return message.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR', { volume: player.volume, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }
    if (player.volume === vol) {
        return message.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))], allowedMentions: { repliedUser: false } });
    }
    if (vol < 0 || vol > maxVolume) {
        return message.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }


    player.setting.volume = vol;
    player.filters.setVolume(vol);

    await dashboard.update(bot, player, player.current!);

    return message.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: vol, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {

    const maxVolume = bot.config.bot.volume.max;
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const vol = Math.floor(interaction.options.getInteger('volume')!);

    if (!vol) {
        return interaction.editReply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR', { volume: player.volume, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }
    if (player.volume === vol) {
        return interaction.editReply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))], allowedMentions: { repliedUser: false } });
    }
    if (vol < 0 || vol > maxVolume) {
        return interaction.editReply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }


    player.setting.volume = vol;
    player.filters.setVolume(vol);

    await dashboard.update(bot, player, player.current!);

    return interaction.editReply({ embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: vol, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
};