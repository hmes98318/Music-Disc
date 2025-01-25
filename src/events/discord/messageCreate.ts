import { Client, Message, ChannelType } from 'discord.js';
import { cst } from '../../utils/constants.js';

import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client, message: Message) => {
    const prefix = bot.config.bot.prefix;

    if (bot.blacklist && bot.blacklist.includes(message.author.id)) return;
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    if (message.content.indexOf(prefix) !== 0) return;


    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = String(args.shift()).toLowerCase();
    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

    if (!cmd) return;

    if (bot.config.bot.specifyMessageChannel && bot.config.bot.specifyMessageChannel !== message.channelId) {
        return message.reply({ content: client.i18n.t('events:MESSAGE_SPECIFIC_CHANNEL_WARN', { channelId: bot.config.bot.specifyMessageChannel }), allowedMentions: { repliedUser: false } })
            .catch((error) => {
                bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                return;
            });
    }

    if (cmd.requireAdmin) {
        if (!bot.config.bot.admin.includes(message.author.id))
            return message.reply({ content: client.i18n.t('events:ERROR_REQUIRE_ADMIN'), allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
    }

    if (cmd.voiceChannel) {
        if (!message.member?.voice.channel)
            return message.reply({ content: client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'), allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });

        if (message.guild?.members.me?.voice.channel && message.member.voice.channelId !== message.guild.members.me.voice.channelId)
            return message.reply({ content: client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'), allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${message.author.username} : ${message.content})` + error);
                    return;
                });
    }


    bot.logger.emit('discord', bot.shardId, `[messageCreate] (${cst.color.grey}${message.guild?.name}${cst.color.white}) ${message.author.username} : ${message.content}`);

    let guild;

    // Ensure guild data is in cache
    try {
        guild = await client.guilds.fetch(message.guildId!);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, `[messageCreate] Error fetching guild (${message.guildId}): ${error}`);
        return message.reply({ content: client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'), allowedMentions: { repliedUser: false } });
    }

    // Ensure member is in cache
    try {
        await guild.members.fetch(message.author.id);
    } catch (error) {
        bot.logger.emit('error', bot.shardId, `[messageCreate] Error fetching member (${message.author.id}): ${error}`);
        return message.reply({ content: client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'), allowedMentions: { repliedUser: false } });
    }


    if (cmd.sendTyping) message.channel.sendTyping();
    cmd.execute(bot, client, message, args);
};