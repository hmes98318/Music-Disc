import { ChannelType, Events } from 'discord.js';

import { BaseDiscordEvent } from './base/BaseDiscordEvent.js';
import { cst } from '../../utils/constants.js';
import { CommandContext } from '../../commands/base/CommandContext.js';
import { CommandValidator } from './base/CommandValidator.js';

import type { Client, Message } from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * MessageCreate event handler
 * Handles text command execution from Discord messages
 */
export class MessageCreateEvent extends BaseDiscordEvent<Events.MessageCreate> {
    public getEventName(): Events.MessageCreate {
        return Events.MessageCreate;
    }

    public async execute(bot: Bot, client: Client, message: Message): Promise<void> {
        if (!message.guild || !message.member) return;

        // Check if message starts with prefix
        const prefix = bot.config.bot.prefix;
        if (message.content.indexOf(prefix) !== 0) return;

        if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
        const isBlacklisted = bot.config.blacklist.includes(message.author.id) || (bot.blacklistManager?.has(message.author.id) ?? false);
        if (isBlacklisted) return;

        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = String(args.shift()).toLowerCase();
        const cmd = client.commands.get(commandName);

        if (!cmd) return;

        // Validate message channel
        const channelValidation = await CommandValidator.validateMessageChannel(
            bot,
            client,
            message,
            message.channelId
        );
        if (!channelValidation.valid) return;

        // Validate admin permission
        const adminValidation = await CommandValidator.validateAdminPermission(
            bot,
            client,
            message,
            cmd,
            message.author.id
        );
        if (!adminValidation.valid) return;

        // Validate DJ permission
        const djValidation = await CommandValidator.validateDJPermission(
            bot,
            client,
            message,
            cmd,
            message.author.id,
            message.member,
            message.guild.id
        );
        if (!djValidation.valid) return;

        // Validate voice channel
        const voiceValidation = await CommandValidator.validateVoiceChannel(
            bot,
            client,
            message,
            cmd,
            message.member,
            message.guild.id
        );
        if (!voiceValidation.valid) return;

        // Log command execution
        bot.logger.emit(
            'discord',
            bot.shardId,
            `[messageCreate] (${cst.color.grey}${message.guild.name}${cst.color.white}) ${message.author.username} : ${message.content}`
        );

        // Ensure guild cache
        const cacheValidation = await CommandValidator.ensureGuildCache(
            bot,
            client,
            message,
            message.guildId!,
            message.author.id
        );
        if (!cacheValidation.valid) return;

        // Execute command
        const context = new CommandContext(message, args);
        await cmd.execute(bot, client, context);
    }
}
