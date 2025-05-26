import { EmbedBuilder, HexColorString } from 'discord.js';
import type { Bot } from '../@types/index.js';


const blacklist = (bot: Bot, userList: { name: string; value: string; }[]) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MESSAGE_BLACKLIST'))
        .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        .addFields(userList)
        .setTimestamp();

    return embed_;
};

const filterMsg = (bot: Bot, effectName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setDescription(bot.i18n.t('embeds:MESSAGE_FILTER', { effectName: effectName }));

    return embed_;
};

const help = (bot: Bot, command: string, description: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MESSAGE_COMMAND', { command: command }))
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

export { blacklist, filterMsg, help, textMsg, textErrorMsg, textSuccessMsg, textWarningMsg };