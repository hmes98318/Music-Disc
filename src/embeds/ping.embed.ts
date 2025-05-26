import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const ping = (bot: Bot, botPing: string, apiPing: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:PING_TITLE'))
        .setDescription(bot.i18n.t('embeds:PING_DESCRIPTION', { botPing: botPing, apiPing: apiPing }));

    return embed_;
};

export { ping };