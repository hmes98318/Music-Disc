import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    Collection
} from 'discord.js';
import i18next from 'i18next';

import { dashboard } from '../dashboard/index.js';
import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'volume';
export const aliases = ['v'];
export const description = i18next.t('commands:CONFIG_VOLUME_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_VOLUME_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'volume',
        description: i18next.t('commands:CONFIG_VOLUME_OPTION_DESCRIPTION'),
        type: 4,
        required: false,
        min_value: 1
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const maxVolume = bot.config.bot.volume.max;
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    // Show volume buttons when no argument is provided
    if (!args[0]) {
        const currentVolume = player.volume;

        const volume25Button = new ButtonBuilder()
            .setCustomId('volume-25')
            .setLabel('25%')
            .setStyle(currentVolume === 25 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume50Button = new ButtonBuilder()
            .setCustomId('volume-50')
            .setLabel('50%')
            .setStyle(currentVolume === 50 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume75Button = new ButtonBuilder()
            .setCustomId('volume-75')
            .setLabel('75%')
            .setStyle(currentVolume === 75 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume100Button = new ButtonBuilder()
            .setCustomId('volume-100')
            .setLabel('100%')
            .setStyle(currentVolume === 100 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(volume25Button, volume50Button, volume75Button, volume100Button);

        const msg = await message.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SELECT', { volume: currentVolume }))],
            components: [row],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (!i.customId.startsWith('volume-')) return;

            const newVolume = parseInt(i.customId.split('-')[1], 10);

            if (player.volume === newVolume) {
                await i.update({
                    embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))],
                    components: []
                });
                return collector.stop();
            }

            if (newVolume > maxVolume) {
                await i.update({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))],
                    components: []
                });
                return collector.stop();
            }

            player.setting.volume = newVolume;
            player.filters.setVolume(newVolume);

            await dashboard.update(bot, player, player.current!);

            await i.update({
                embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: newVolume, maxVolume: maxVolume }))],
                components: []
            });

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: []
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });

        return;
    }

    await message.react('👍');
    const vol = parseInt(args[0], 10);

    if (!vol) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR', { volume: player.volume, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }
    if (player.volume === vol) {
        return message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))], allowedMentions: { repliedUser: false } });
    }
    if (vol < 0 || vol > maxVolume) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }


    player.setting.volume = vol;
    player.filters.setVolume(vol);

    await dashboard.update(bot, player, player.current!);

    return message.reply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: vol, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {

    const maxVolume = bot.config.bot.volume.max;
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const volumeInput = interaction.options.getInteger('volume');

    // Show volume buttons when no argument is provided
    if (volumeInput === null) {
        const currentVolume = player.volume;

        const volume25Button = new ButtonBuilder()
            .setCustomId('volume-25')
            .setLabel('25%')
            .setStyle(currentVolume === 25 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume50Button = new ButtonBuilder()
            .setCustomId('volume-50')
            .setLabel('50%')
            .setStyle(currentVolume === 50 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume75Button = new ButtonBuilder()
            .setCustomId('volume-75')
            .setLabel('75%')
            .setStyle(currentVolume === 75 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume100Button = new ButtonBuilder()
            .setCustomId('volume-100')
            .setLabel('100%')
            .setStyle(currentVolume === 100 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(volume25Button, volume50Button, volume75Button, volume100Button);

        const msg = await interaction.editReply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SELECT', { volume: currentVolume }))],
            components: [row],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (!i.customId.startsWith('volume-')) return;

            const newVolume = parseInt(i.customId.split('-')[1], 10);

            if (player.volume === newVolume) {
                await i.update({
                    embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))],
                    components: []
                });
                return collector.stop();
            }

            if (newVolume > maxVolume) {
                await i.update({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))],
                    components: []
                });
                return collector.stop();
            }

            player.setting.volume = newVolume;
            player.filters.setVolume(newVolume);

            await dashboard.update(bot, player, player.current!);

            await i.update({
                embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: newVolume, maxVolume: maxVolume }))],
                components: []
            });

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: []
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });

        return;
    }

    const vol = Math.floor(volumeInput);

    if (!vol) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR', { volume: player.volume, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }
    if (player.volume === vol) {
        return interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))], allowedMentions: { repliedUser: false } });
    }
    if (vol < 0 || vol > maxVolume) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
    }


    player.setting.volume = vol;
    player.filters.setVolume(vol);

    await dashboard.update(bot, player, player.current!);

    return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: vol, maxVolume: maxVolume }))], allowedMentions: { repliedUser: false } });
};