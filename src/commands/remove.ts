import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type {
    ChatInputCommandInteraction,
    Client,
    Message,
    ReadonlyCollection
} from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'remove';
export const aliases = ['rm'];
export const description = i18next.t('commands:CONFIG_REMOVE_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_REMOVE_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'index',
        description: i18next.t('commands:CONFIG_REMOVE_OPTION_DESCRIPTION'),
        type: 10,
        required: false
    },
    {
        name: 'index2',
        description: i18next.t('commands:CONFIG_REMOVE_OPTION_DESCRIPTION_2'),
        type: 10,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player || !player.playing) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\``; });

    if (tracks.length < 1) {
        return message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_QUEUE_EMPTY'))], allowedMentions: { repliedUser: false } });
    }

    let SUCCESS = false;

    if (args.length === 1) { // +rm 1
        const index = parseInt(args[0]);
        SUCCESS = player.queue.remove(index - 1);

        if (!SUCCESS) {
            return message.react('❌');
        }
        else {
            await message.react('👍');
            return message.reply({
                embeds: [embeds.removeTrack(bot, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (args.length === 2) { // +rm 3 4
        const index1 = parseInt(args[0]),
            index2 = parseInt(args[1]);
        SUCCESS = player.queue.remove(index1 - 1, index2 - index1 + 1);

        if (!SUCCESS) {
            return message.react('❌');
        }
        else {
            const musicTitle = tracks.slice(index1 - 1, index2).join('\n');
            await message.react('👍');
            return message.reply({
                embeds: [embeds.removeTrack(bot, musicTitle)],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (args.length < 1) { // +rm
        const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
        let tracksQueue = '';

        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += client.i18n.t('commands:MESSAGE_NOW_PLAYING_BUTTOMTITLE', { length: tracks.length - 10 });
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const methods = ['OFF', 'SINGLE', 'ALL'];
        const repeatMode = player.repeatMode;
        const instruction = client.i18n.t('commands:MESSAGE_REMOVE_INSTRUCTION', { length: tracks.length });

        await message.react('👍');
        const msg = await message.reply({
            content: instruction,
            embeds: [embeds.removeList(bot, nowplaying, tracksQueue, methods[repeatMode])],
            allowedMentions: { repliedUser: false }
        });


        const collector = (message.channel as any /* discord.js type error ? (v14.16.2) */).createMessageCollector({
            time: 10000, // 10s
            filter: (m: any) => m.author.id === message.author.id
        });

        collector.on('collect', async (query: Message<boolean>) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                await message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_CANCEL'))], allowedMentions: { repliedUser: false } });
                return collector.stop();
            }

            await query.react('👍');
            player.queue.remove(index - 1);

            await query.reply({
                embeds: [embeds.removeTrack(bot, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });

            msg.delete()
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on('end', async (collected: ReadonlyCollection<string, Message<boolean>>, reason: string) => {
            if (reason == 'time' && collected.size == 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    allowedMentions: { repliedUser: false }
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player || !player.playing) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_NO_PLAYING'))], allowedMentions: { repliedUser: false } });
    }

    const tracks = player.queue.tracks.map((track, index) => { return `${++index}. \`${track.title}\``; });

    if (tracks.length < 1) {
        return interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_QUEUE_EMPTY'))], allowedMentions: { repliedUser: false } });
    }

    const index1 = interaction.options.getNumber('index');
    const index2 = interaction.options.getNumber('index2');
    let SUCCESS = false;

    if ((index1 === null && index2 !== null) || (index1 !== null && index2 === null)) { // +rm 1
        const index = index1 || index2;
        SUCCESS = player.queue.remove(index! - 1);

        if (!SUCCESS) {
            return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_FAIL'))], allowedMentions: { repliedUser: false } });
        }
        else {
            return interaction.editReply({
                embeds: [embeds.removeTrack(bot, tracks[index! - 1])],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (index1 !== null && index2 !== null) { // +rm 3 4
        SUCCESS = player.queue.remove(index1 - 1, index2 - index1 + 1);

        if (!SUCCESS) {
            return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_FAIL'))], allowedMentions: { repliedUser: false } });
        }
        else {
            const musicTitle = tracks.slice(index1 - 1, index2).join('\n');
            return interaction.editReply({
                embeds: [embeds.removeTrack(bot, musicTitle)],
                allowedMentions: { repliedUser: false }
            });
        }
    }
    else if (index1 === null && index2 === null) { // +rm
        const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
        let tracksQueue = '';

        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += client.i18n.t('commands:MESSAGE_NOW_PLAYING_BUTTOMTITLE', { length: tracks.length - 10 });
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const methods = ['OFF', 'SINGLE', 'ALL'];
        const repeatMode = player.repeatMode;
        const instruction = client.i18n.t('commands:MESSAGE_REMOVE_INSTRUCTION', { length: tracks.length });

        const msg = await interaction.editReply({
            content: instruction,
            embeds: [embeds.removeList(bot, nowplaying, tracksQueue, methods[repeatMode])],
            allowedMentions: { repliedUser: false }
        });


        const collector = (interaction.channel as any /* discord.js type error ? (v14.16.2) */).createMessageCollector({
            time: 10000, // 10s
            filter: (m: any) => m.author.id === interaction.user.id
        });

        collector.on('collect', async (query: Message<boolean>) => {

            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                await interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_CANCEL'))], allowedMentions: { repliedUser: false } });
                return collector.stop();
            }

            await query.react('👍');
            player.queue.remove(index - 1);

            await query.reply({
                embeds: [embeds.removeTrack(bot, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });

            msg.delete()
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on('end', async (collected: ReadonlyCollection<string, Message<boolean>>, reason: string) => {
            if (reason == 'time' && collected.size == 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    allowedMentions: { repliedUser: false }
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }
};