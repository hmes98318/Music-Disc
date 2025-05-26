import i18next from 'i18next';
import { RepeatMode } from 'lavashark';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { Client, Message, ChatInputCommandInteraction } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'loop';
export const aliases = ['lp'];
export const description = i18next.t('commands:CONFIG_LOOP_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_LOOP_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'mode',
        description: i18next.t('commands:CONFIG_LOOP_OPTION_DESCRIPTION'),
        type: 3,
        required: true,
        choices: [
            {
                name: 'Off',
                value: 'off'
            },
            {
                name: 'One',
                value: 'one'
            },
            {
                name: 'All',
                value: 'all'
            }
        ]
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    let mode = null;
    const methods = ['OFF', 'SINGLE', 'ALL'];

    if (!args[0]) return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_LOOP_COMMAND', { command: `${bot.config.bot.prefix}${usage}` }))], allowedMentions: { repliedUser: false } });

    switch (args[0].toLowerCase()) {
        case 'off': {
            mode = 0;
            player.setRepeatMode(RepeatMode.OFF);
            break;
        }
        case 'one':
        case 'single': {
            mode = 1;
            player.setRepeatMode(RepeatMode.TRACK);
            break;
        }
        case 'all':
        case 'queue': {
            mode = 2;
            player.setRepeatMode(RepeatMode.QUEUE);
            break;
        }
        default: {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_LOOP_COMMAND', { command: `${bot.config.bot.prefix}${usage}` }))], allowedMentions: { repliedUser: false } });
        }
    }

    await message.react('👍');
    return message.reply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_LOOP_MODE', { mode: methods[mode] }))], allowedMentions: { repliedUser: false } });
};


export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    let mode = null;
    const methods = ['OFF', 'SINGLE', 'ALL'];

    switch (interaction.options.getString('mode')) {
        case 'off': {
            mode = 0;
            player.setRepeatMode(RepeatMode.OFF);
            break;
        }
        case 'one': {
            mode = 1;
            player.setRepeatMode(RepeatMode.TRACK);
            break;
        }
        case 'all': {
            mode = 2;
            player.setRepeatMode(RepeatMode.QUEUE);
            break;
        }
        default: {
            return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_LOOP_COMMAND', { command: `${bot.config.bot.prefix}${usage}` }))], allowedMentions: { repliedUser: false } });
        }
    }

    return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_LOOP_MODE', { mode: methods[mode] }))], allowedMentions: { repliedUser: false } });
};