import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const connected = (bot: Bot) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.success as HexColorString | number)
        .setDescription(bot.i18n.t('embeds:DASHBOARD_VOICE_CHANNEL_CONNECT_SUCCESS'));

    return embed_;
};

const disconnect = (bot: Bot) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setDescription(bot.i18n.t('embeds:DASHBOARD_FINISH_PLAYING'));

    return embed_;
};

const dashboard = (bot: Bot, status: string, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: status, value: subtitle })
        .setTimestamp();

    return embed_;
};
export { connected, disconnect, dashboard };