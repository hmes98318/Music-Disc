import { dashboard } from '../dashboard/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'leave';
export const aliases = ['stop'];
export const description = 'Leave current voice channel';
export const usage = 'leave';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = false;
export const options = [];


export const execute = async (bot: Bot, client: Client, message: Message) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    if (bot.config.bot.autoLeave.enabled) {
        player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(bot, player);
    }

    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: client.i18n.t('commands:ERROR_NO_PLAYING'), allowedMentions: { repliedUser: false } });
    }

    if (bot.config.bot.autoLeave.enabled) {
        player.destroy();
    }
    else {
        player.queue.clear();
        await player.skip();
        await dashboard.destroy(bot, player);
    }

    return interaction.editReply(client.i18n.t('commands:MESSAGE_LEAVE_SUCCESS'));
};