import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';



const server = (bot: Bot, serverlist: string, djRole?: string, admins?: string, djUsers?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:SERVER_TITLE', {name: bot.config.bot.name}))
        .setDescription(serverlist);

    // Add DJ information fields if provided
    if (djRole) {
        embed_.addFields({ name: 'DJ Role', value: djRole, inline: true });
    }
    if (admins) {
        embed_.addFields({ name: 'Admins', value: admins, inline: true });
    }
    if (djUsers) {
        embed_.addFields({ name: 'DJ Users', value: djUsers, inline: false });
    }

    return embed_;
};

export { server };