import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'dashboard';
export const aliases = ['d', 'console'];
export const description = i18next.t('commands:CONFIG_DASHBOARD_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_DASHBOARD_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.dashboardMsg) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboardMsg?.delete();
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Dashboard delete error:' + error);
    }

    await client.dashboard.initialize(message, player);
    if (player.current) await client.dashboard.update(player, player.current);
    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.dashboardMsg) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    try {
        await player.dashboardMsg.delete();
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Dashboard delete error:' + error);
    }

    await client.dashboard.initialize(interaction, player);
    if (player.current) await client.dashboard.update(player, player.current);
    return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_DASHBOARD_SUCCESS'))], allowedMentions: { repliedUser: false } });
};