import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const addTrack = (bot: Bot, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: bot.i18n.t('embeds:QUEUE_ADD_TRACK'), value: subtitle, inline: true })
        .setTimestamp();

    return embed_;
};

const addPlaylist = (bot: Bot, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: bot.i18n.t('embeds:QUEUE_ADD_PLAYLIST'), value: subtitle, inline: true })
        .setTimestamp();

    return embed_;
};

const queue = (bot: Bot, nowPlaying: string, queueList: string, repeatMode: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:QUEUE_LIST_TITLE'))
        .addFields({ name: nowPlaying, value: queueList })
        .setTimestamp()
        .setFooter({ text: bot.i18n.t('embeds:QUEUE_LIST_LOOP_MODE', { repeatMode: repeatMode }) });

    return embed_;
};

export { addTrack, addPlaylist, queue };