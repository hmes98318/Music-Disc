import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const ping = (bot: Bot, botPing: string, apiPing: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:PING_TITLE', { lng }))
        .setDescription(bot.i18n.t('embeds:PING_DESCRIPTION', { botPing: botPing, apiPing: apiPing, lng }));

    return embed_;
};

export { ping };