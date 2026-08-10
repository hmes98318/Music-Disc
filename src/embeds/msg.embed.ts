import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const filterMsg = (bot: Bot, effectName: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setDescription(bot.i18n.t('embeds:MESSAGE_FILTER', { effectName: effectName, lng }));

    return embed_;
};

const help = (bot: Bot, command: string, description: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MESSAGE_COMMAND', { command: command, lng }))
        .setDescription(description);

    return embed_;
};

const textMsg = (bot: Bot, message: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setDescription(message);

    return embed_;
};

const textErrorMsg = (bot: Bot, message: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.error as HexColorString | number)
        .setDescription(message);

    return embed_;
};

const textSuccessMsg = (bot: Bot, message: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.success as HexColorString | number)
        .setDescription(message);

    return embed_;
};

const textWarningMsg = (bot: Bot, message: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.warning as HexColorString | number)
        .setDescription(message);

    return embed_;
};

export { filterMsg, help, textMsg, textErrorMsg, textSuccessMsg, textWarningMsg };
