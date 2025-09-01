import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { embeds } from '../embeds/index.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';

import type {
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    Message
} from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'dj';
export const aliases = ['adddj'];
export const description = i18next.t('commands:CONFIG_DJ_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_DJ_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = false;
export const options = [
    {
        name: 'user',
        description: i18next.t('commands:CONFIG_DJ_OPTION_DESCRIPTION'),
        type: ApplicationCommandOptionType.User,
        required: true
    }
];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    // Check if user has permission to add DJ
    const member = message.member as GuildMember;
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!DJManager.isDJ(bot, message.author.id, member, player || undefined) && !bot.config.bot.admin.includes(message.author.id)) {
        return message.reply({
            embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_PERMISSION'))],
            allowedMentions: { repliedUser: false }
        });
    }


    // Parse mentioned user
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return message.reply({
            embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_MENTION_USER'))],
            allowedMentions: { repliedUser: false }
        });
    }

    if (mentionedUser.bot) {
        return message.reply({
            embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_BOTS'))],
            allowedMentions: { repliedUser: false }
        });
    }

    // Handle different DJ modes
    if (bot.config.bot.djMode === DJModeEnum.STATIC) {
        // In static mode, just inform that it's managed via config
        return message.reply({
            embeds: [embeds.textWarningMsg(bot, i18next.t('commands:MESSAGE_DJ_STATIC_MODE'))],
            allowedMentions: { repliedUser: false }
        });
    }
    // DYNAMIC mode - add to current player's DJ list
    else {
        if (!player) {
            return message.reply({
                embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_PLAYER'))],
                allowedMentions: { repliedUser: false }
            });
        }

        // Check if user is already a DJ
        if (DJManager.isDJ(bot, mentionedUser.id, null, player)) {
            return message.reply({
                embeds: [embeds.textWarningMsg(bot, i18next.t('commands:MESSAGE_DJ_ALREADY_DJ', { userId: mentionedUser.id }))],
                allowedMentions: { repliedUser: false }
            });
        }


        DJManager.addDJ(player, mentionedUser.id);

        return message.reply({
            embeds: [embeds.textSuccessMsg(bot, i18next.t('commands:MESSAGE_DJ_SUCCESS', { userId: mentionedUser.id }))],
            allowedMentions: { repliedUser: false }
        });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember;
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    // Check if user has permission to add DJ
    if (!DJManager.isDJ(bot, interaction.user.id, member, player || undefined) && !bot.config.bot.admin.includes(interaction.user.id)) {
        return interaction.editReply({
            embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_PERMISSION'))],
            allowedMentions: { repliedUser: false }
        });
    }


    const targetUser = interaction.options.getUser('user', true);

    if (targetUser.bot) {
        return interaction.editReply({
            embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_BOTS'))],
            allowedMentions: { repliedUser: false }
        });
    }

    // Handle different DJ modes
    if (bot.config.bot.djMode === DJModeEnum.STATIC) {
        return interaction.editReply({
            embeds: [embeds.textWarningMsg(bot, i18next.t('commands:MESSAGE_DJ_STATIC_MODE'))],
            allowedMentions: { repliedUser: false }
        });
    }
    // DYNAMIC mode - add to current player's DJ list
    else {
        if (!player) {
            return interaction.editReply({
                embeds: [embeds.textErrorMsg(bot, i18next.t('commands:MESSAGE_DJ_NO_PLAYER'))],
                allowedMentions: { repliedUser: false }
            });
        }

        // Check if user is already a DJ
        if (DJManager.isDJ(bot, targetUser.id, null, player)) {
            return interaction.editReply({
                embeds: [embeds.textWarningMsg(bot, i18next.t('commands:MESSAGE_DJ_ALREADY_DJ', { userId: targetUser.id }))],
                allowedMentions: { repliedUser: false }
            });
        }


        DJManager.addDJ(player, targetUser.id);

        return interaction.editReply({
            embeds: [embeds.textSuccessMsg(bot, i18next.t('commands:MESSAGE_DJ_SUCCESS', { userId: targetUser.id }))],
            allowedMentions: { repliedUser: false }
        });
    }
};
