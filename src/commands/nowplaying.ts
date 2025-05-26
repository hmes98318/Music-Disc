import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    Message
} from 'discord.js';
import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { Bot } from '../@types/index.js';


export const name = 'nowplaying';
export const aliases = ['np', 'save'];
export const description = i18next.t('commands:CONFIG_NOW_PLAYING_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_NOW_PLAYING_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const track = player.current;
    const subtitle = client.i18n.t('commands:MESSAGE_NOW_PLAYING_SUBTITLE', { author: track?.author, label: track?.duration.label });

    const saveButton = new ButtonBuilder()
        .setCustomId('musicSave')
        .setLabel(client.i18n.t('commands:MESSAGE_NOW_PLAYING_SAVE_BUTTON'))
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(saveButton);

    return message.reply({
        embeds: [embeds.save(bot, track!.title, subtitle, track!.uri, track!.thumbnail!)],
        components: [row],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const track = player.current;
    const subtitle = client.i18n.t('commands:MESSAGE_NOW_PLAYING_SUBTITLE', { author: track?.author, label: track?.duration.label });

    const saveButton = new ButtonBuilder()
        .setCustomId('musicSave')
        .setLabel(client.i18n.t('commands:MESSAGE_NOW_PLAYING_SAVE_BUTTON'))
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(saveButton);

    return interaction.editReply({
        embeds: [embeds.save(bot, track!.title, subtitle, track!.uri, track!.thumbnail!)],
        components: [row],
        allowedMentions: { repliedUser: false }
    });
};