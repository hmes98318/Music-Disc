import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'ping';
export const aliases = [];
export const description = i18next.t('commands:CONFIG_PING_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_PING_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const botPing = `${Date.now() - message.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    await message.react('👍');

    return message.reply({
        embeds: [embeds.ping(bot, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
    const apiPing = client.ws.ping.toString();

    return interaction.editReply({
        embeds: [embeds.ping(bot, botPing, apiPing)],
        allowedMentions: { repliedUser: false }
    });
};