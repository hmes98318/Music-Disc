import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';



const server = (bot: Bot, serverlist: string, djRole?: string, admins?: string, djUsers?: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:SERVER_TITLE', { name: bot.config.bot.name, lng }))
        .setDescription(serverlist);

    // Add DJ information fields if provided
    if (djRole) {
        embed_.addFields({ name: bot.i18n.t('embeds:SERVER_FIELD_DJ_ROLE', { lng }), value: djRole, inline: true });
    }
    if (admins) {
        embed_.addFields({ name: bot.i18n.t('embeds:SERVER_FIELD_ADMINS', { lng }), value: admins, inline: true });
    }
    if (djUsers) {
        embed_.addFields({ name: bot.i18n.t('embeds:SERVER_FIELD_DJ_USERS', { lng }), value: djUsers, inline: false });
    }

    return embed_;
};

export { server };