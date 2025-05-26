import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const removeList = (bot: Bot, nowPlaying: string, queueList: string, repeatMode: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:REMOVE_LIST_TITLE'))
        .addFields({ name: nowPlaying, value: queueList })
        .setTimestamp()
        .setFooter({ text: bot.i18n.t('embeds:REMOVE_LIST_LOOP_MODE', { repeatMode: repeatMode }) });

    return embed_;
};

const removeTrack = (bot: Bot, musicTitle: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.success as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:REMOVE_TRACK_TITLE'))
        .setDescription(musicTitle)
        .setTimestamp();

    return embed_;
};

export { removeList, removeTrack };