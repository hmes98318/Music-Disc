import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';



const server = (bot: Bot, serverlist: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:SERVER_TITLE', {name: bot.config.bot.name}))
        .setDescription(serverlist);

    return embed_;
};

export { server };