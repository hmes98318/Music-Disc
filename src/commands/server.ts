import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'server';
export const aliases = [];
export const description = i18next.t('commands:CONFIG_SERVER_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_SERVER_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const serverlist = client.guilds.cache
        .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
        .join('\n\n');

    return message.reply({
        embeds: [embeds.server(bot, serverlist)],
        allowedMentions: { repliedUser: false }
    });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const serverlist = client.guilds.cache
        .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
        .join('\n\n');

    return interaction.editReply({
        embeds: [embeds.server(bot, serverlist)],
        allowedMentions: { repliedUser: false }
    });
};