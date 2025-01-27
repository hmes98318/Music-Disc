import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'language';
export const aliases = ['lang', 'locale'];
export const description = 'Change the Bot locale';
export const usage = 'language <locale>';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = false;
export const options = [
    {
        name: 'locale',
        description: 'Locale name',
        type: 3,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const locale = args[0];

    if (!locale) {
        return message.reply({
            content: bot.i18n.t('commands:MESSAGE_LANG_AVAILABLE_LIST', { langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ') }),
            allowedMentions: { repliedUser: false }
        });
    }
    if (!bot.lang.languages.includes(locale)) {
        return message.reply({
            content: bot.i18n.t('commands:MESSAGE_LANG_ARGS_ERROR', { langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ') }),
            allowedMentions: { repliedUser: false }
        });
    }


    await bot.i18n.changeLanguage(locale);

    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {

    const locale = interaction.options.getString('locale');

    if (!locale) {
        return interaction.editReply({
            content: bot.i18n.t('commands:MESSAGE_LANG_AVAILABLE_LIST', { langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ') }),
            allowedMentions: { repliedUser: false }
        });
    }
    if (!bot.lang.languages.includes(locale)) {
        return interaction.editReply({
            content: bot.i18n.t('commands:MESSAGE_LANG_ARGS_ERROR', { langList: bot.lang.languages.map(lang => `\`${lang}\``).join(', ') }),
            allowedMentions: { repliedUser: false }
        });
    }


    await bot.i18n.changeLanguage(locale);

    return interaction.editReply(client.i18n.t('commands:MESSAGE_LANG_SUCCESS', { locale: locale }));
};