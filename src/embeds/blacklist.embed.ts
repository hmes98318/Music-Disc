import { EmbedBuilder } from 'discord.js';

import type { HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


interface BlacklistedUser {
    name: string;
    value: string;
}

const blacklist = (
    bot: Bot,
    userList: BlacklistedUser[],
    lng?: string,
): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MESSAGE_BLACKLIST', { lng }))
        .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        .addFields(userList)
        .setTimestamp();
};

const blacklistList = (
    bot: Bot,
    userIds: string[],
    lng?: string,
): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('commands:MESSAGE_BLACKLIST_LIST_TITLE', { lng }))
        .setDescription(userIds.map((userId) => `<@${userId}>`).join('\n'))
        .setTimestamp();
};

export { blacklist, blacklistList };
