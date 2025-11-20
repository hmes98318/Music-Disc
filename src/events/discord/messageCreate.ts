import { Client, Message, ChannelType } from 'discord.js';
import { cst } from '../../utils/constants.js';
import { embeds } from '../../embeds/index.js';
import { PermissionManager } from '../../lib/PermissionManager.js';
import { CommandContext } from '../../commands/base/CommandContext.js';

import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client, message: Message) => {
    if (!message.guild || !message.member) return;


    const prefix = bot.config.bot.prefix;

    if (message.content.indexOf(prefix) !== 0) return;
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;


    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = String(args.shift()).toLowerCase();
    const cmd = client.commands.get(commandName);

    if (!cmd) return;

    const metadata = cmd.getMetadata(bot);

    if (bot.config.blacklist && bot.config.blacklist.includes(message.author.id)) return;

    if (bot.config.bot.specifyMessageChannel && bot.config.bot.specifyMessageChannel !== message.channelId) {
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:MESSAGE_SPECIFIC_CHANNEL_WARN', { channelId: bot.config.bot.specifyMessageChannel }))], allowedMentions: { repliedUser: false } })
            .catch((error) => {
                bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                return;
            });
    }

    // Admin command
    if (bot.config.command.adminCommand.includes(metadata.name)) {
        if (!bot.config.bot.admin.includes(message.author.id)) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
        }
    }

    // DJ command
    if (bot.config.command.djCommand.includes(metadata.name)) {
        const player = client.lavashark.getPlayer(message.guild.id);
        if (!PermissionManager.hasDJCommandPermission(bot, message.author.id, message.member, player || undefined)) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                });
        }
    }

    // Check voice channel
    if (metadata.voiceChannel) {
        if (!message.member.voice.channel) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
        }

        if (bot.config.bot.specifyVoiceChannel && message.member.voice.channelId !== bot.config.bot.specifyVoiceChannel) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERRPR_NOT_IN_SPECIFIC_VOICE_CHANNEL', { channelId: bot.config.bot.specifyVoiceChannel }))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
        }


        if (message.guild.members.me?.voice.channel && message.member.voice.channelId !== message.guild.members.me.voice.channelId) {
            return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
        }
    }


    bot.logger.emit('discord', bot.shardId, `[messageCreate] (${cst.color.grey}${message.guild.name}${cst.color.white}) ${message.author.username} : ${message.content}`);

    let guild;

    // Ensure guild data is in cache
    try {
        guild = await client.guilds.fetch(message.guildId!);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, `[messageCreate] Error fetching guild (${message.guildId}): ${error}`);
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))], allowedMentions: { repliedUser: false } });
    }

    // Ensure member is in cache
    try {
        await guild.members.fetch(message.author.id);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, `[messageCreate] Error fetching member (${message.author.id}): ${error}`);
        return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))], allowedMentions: { repliedUser: false } });
    }

    // Create command context and execute
    const context = new CommandContext(message, args);
    await cmd.execute(bot, client, context);
};