import i18next from 'i18next';

import { dashboard } from '../dashboard/index.js';
import { embeds } from '../embeds/index.js';
import { isUserInBlacklist } from '../utils/functions/isUserInBlacklist.js';
import { DJManager } from '../lib/DjManager.js';
import { CommandCategory, DJModeEnum, LoadType } from '../@types/index.js';

import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';
import type { Bot } from '../@types/index.js';


export const name = 'play';
export const aliases = ['p'];
export const description = i18next.t('commands:CONFIG_PLAY_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_PLAY_USAGE');
export const category = CommandCategory.MUSIC;
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'play',
        description: i18next.t('commands:CONFIG_PLAY_OPTION_DESCRIPTION'),
        type: 3,
        required: true
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    if (!args[0]) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_ARGS_ERROR'))], allowedMentions: { repliedUser: false } });
    }

    const str = args.join(' ');
    let res;

    try {
        res = await client.lavashark.search(str);
    } catch (error) {
        console.error(error);
        bot.logger.emit('error', bot.shardId, `Search Error: ${error}`);
        return message.reply({
            embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', { reason: error instanceof Error ? error.message : String(error) }))],
            allowedMentions: { repliedUser: false }
        });
    }

    if (res.loadType === LoadType.ERROR) {
        bot.logger.emit('error', bot.shardId, `Search Error: ${JSON.stringify(res)}`);
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', { reason: (res as any).data?.message }))], allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === LoadType.EMPTY) {
        return message.reply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_SEARCH_NO_MATCH'))], allowedMentions: { repliedUser: false } });
    }


    const validBlackist = isUserInBlacklist(message.member?.voice.channel, bot.config.blacklist);
    if (validBlackist.length > 0) {
        return message.reply({
            embeds: [embeds.blacklist(bot, validBlackist)],
            allowedMentions: { repliedUser: false }
        });
    }


    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(message.guild?.id),
        voiceChannelId: String(message.member?.voice.channelId),
        textChannelId: message.channel.id,
        selfDeaf: true
    });

    if (!player.setting) {
        player.setting = {
            queuePage: null,
            volume: null
        };
    }

    const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = message;
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_JOIN_CHANNEL'))], allowedMentions: { repliedUser: false } });
    }

    try {
        // Intial dashboard
        if (!player.dashboard) await dashboard.initial(bot, message, player);
    } catch (error) {
        await dashboard.destroy(bot, player);
    }

    // Set first user as DJ in dynamic mode
    if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(player)) {
        DJManager.addDJ(player, message.author.id);
    }


    if (res.loadType === LoadType.PLAYLIST) {
        player.addTracks(res.tracks, (message.author as any));
    }
    else {
        const track = res.tracks[0];
        player.addTracks(track, (message.author as any));
    }

    if (!player.playing) {
        player.filters.setVolume(curVolume);
        await player.play()
            .catch(async (error) => {
                bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                await message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }))], allowedMentions: { repliedUser: false } });
                return player.destroy();
            });
    }

    return message.react('👍');
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const str = interaction.options.getString('play');
    let res;

    if (!str) {
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_ARGS_ERROR'))], allowedMentions: { repliedUser: false } });
    }


    try {
        res = await client.lavashark.search(str);
    } catch (error) {
        console.error(error);
        bot.logger.emit('error', bot.shardId, `Search Error: ${error}`);
        return interaction.editReply({
            embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', { reason: error instanceof Error ? error.message : String(error) }))],
            allowedMentions: { repliedUser: false }
        });
    }

    if (res.loadType === LoadType.ERROR) {
        bot.logger.emit('error', bot.shardId, `Search Error: ${JSON.stringify(res)}`);
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', { reason: (res as any).data?.message }))], allowedMentions: { repliedUser: false } });
    }
    else if (res.loadType === LoadType.EMPTY) {
        return interaction.editReply({ embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_SEARCH_NO_MATCH'))], allowedMentions: { repliedUser: false } });
    }


    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    const validBlackist = isUserInBlacklist(channel, bot.config.blacklist);
    if (validBlackist.length > 0) {
        return interaction.editReply({
            embeds: [embeds.blacklist(bot, validBlackist)],
            allowedMentions: { repliedUser: false }
        });
    }


    // Creates the audio player
    const player = client.lavashark.createPlayer({
        guildId: String(interaction.guild?.id),
        voiceChannelId: String(channel?.id),
        textChannelId: interaction.channel?.id,
        selfDeaf: true
    });

    if (!player.setting) {
        player.setting = {
            queuePage: null,
            volume: null
        };
    }

    const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

    try {
        // Connects to the voice channel
        await player.connect();
        player.metadata = interaction;
        player.filters.setVolume(curVolume);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
        return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_JOIN_CHANNEL'))], allowedMentions: { repliedUser: false } });
    }

    try {
        // Intial dashboard
        if (!player.dashboard) await dashboard.initial(bot, interaction, player);
    } catch (error) {
        await dashboard.destroy(bot, player);
    }

    // Set first user as DJ in dynamic mode
    if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(player)) {
        DJManager.addDJ(player, interaction.user.id);
    }


    if (res.loadType === LoadType.PLAYLIST) {
        player.addTracks(res.tracks, (interaction.user as any));
    }
    else {
        const track = res.tracks[0];
        player.addTracks(track, (interaction.user as any));
    }

    if (!player.playing) {
        player.filters.setVolume(curVolume);
        await player.play()
            .catch(async (error) => {
                bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                await interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }))], allowedMentions: { repliedUser: false } });
                return player.destroy();
            });
    }

    return interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_MUSIC_ADD'))], allowedMentions: { repliedUser: false } });
};