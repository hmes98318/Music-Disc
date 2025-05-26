import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js';
import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { filtersConfig } from '../utils/constants.js';
import { CommandCategory } from '../@types/index.js';

import type { Bot } from '../@types/index.js';


export const name = 'filter';
export const aliases = ['eq', 'equalizer'];
export const description = i18next.t('commands:CONFIG_FILTER_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_FILTER_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'filter',
        description: i18next.t('commands:CONFIG_FILTER_OPTION_DESCRIPTION'),
        type: 3,
        required: true,
        choices: [
            ...(Object.keys(filtersConfig).map((effectName) => {
                return {
                    name: effectName,
                    value: effectName
                };
            })),
            { name: 'clear', value: 'clear' }
        ]
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    if (!args[0]) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('filterSelect')
            .setPlaceholder(client.i18n.t('commands:MESSAGE_FILTER_SELECT_MODE'))
            .setOptions([
                ...(Object.keys(filtersConfig).map((effectName) => {
                    return {
                        label: effectName,
                        value: effectName
                    };
                })),
                { label: 'clear', value: 'clear' }
            ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await message.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_FILTER_SELECT_LIST'))],
            components: [row.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== 'filterSelect') return;

            const effectName = i.values[0];

            if (effectName === 'clear') {
                player.filters.clear();
            }
            else {
                if (!Object.keys(filtersConfig).includes(effectName)) {
                    return message.reply({
                        embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_FILTER_NOT_FOUND'))],
                        allowedMentions: { repliedUser: false }
                    });
                }

                player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
            }


            await message.react('👍');

            i.deferUpdate();
            await msg.edit({
                embeds: [embeds.filterMsg(bot, effectName)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: [],
                    allowedMentions: { repliedUser: false }
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }
    else {
        const effectName = String(args[0]).toLowerCase();

        if (effectName === 'clear') {
            player.filters.clear();
        }
        else if (!Object.keys(filtersConfig).includes(effectName)) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_FILTER_NOT_FOUND'))], allowedMentions: { repliedUser: false } });
        }


        player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);

        return message.react('👍');
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }


    const effectName = interaction.options.getString('filter');

    if (effectName === 'clear') {
        player.filters.clear();
    }
    else {
        player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
    }


    return interaction.editReply({
        embeds: [embeds.filterMsg(bot, effectName ?? 'unknown')],
        components: [],
        allowedMentions: { repliedUser: false }
    })
        .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
};