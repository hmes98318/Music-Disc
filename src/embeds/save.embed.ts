import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const save = (bot: Bot, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .setDescription(subtitle)
        .setTimestamp();

    return embed_;
};

export { save };