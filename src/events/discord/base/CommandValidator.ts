import { Message, ChatInputCommandInteraction } from 'discord.js';

import { embeds } from '../../../embeds/index.js';
import { PermissionManager } from '../../../lib/PermissionManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { Bot } from '../../../@types/index.js';
import type { BaseCommand } from '../../../commands/base/BaseCommand.js';


/**
 * Validation result for command execution
 */
export interface ValidationResult {
    valid: boolean;
    errorSent?: boolean;
}

/**
 * Command validator for shared validation logic between message and interaction commands
 */
export class CommandValidator {
    /**
     * Validate if command should be executed in specified message channel
     */
    public static async validateMessageChannel(
        bot: Bot,
        client: Client,
        source: Message | ChatInputCommandInteraction,
        channelId: string
    ): Promise<ValidationResult> {
        if (bot.config.bot.specifyMessageChannel && bot.config.bot.specifyMessageChannel !== channelId) {
            const username = source instanceof Message ? source.author.username : source.user.username;
            const content = source instanceof Message ? source.content : `/${source.commandName}`;

            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:MESSAGE_SPECIFIC_CHANNEL_WARN', {
                    channelId: bot.config.bot.specifyMessageChannel
                }))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
            });

            return { valid: false, errorSent: true };
        }

        return { valid: true };
    }

    /**
     * Validate if user has admin permission for admin commands
     */
    public static async validateAdminPermission(
        bot: Bot,
        client: Client,
        source: Message | ChatInputCommandInteraction,
        command: BaseCommand,
        userId: string
    ): Promise<ValidationResult> {
        const metadata = command.getMetadata(bot);

        if (bot.config.command.adminCommand.includes(metadata.name)) {
            if (!bot.config.bot.admin.includes(userId)) {
                const username = source instanceof Message ? source.author.username : source.user.username;
                const content = source instanceof Message ? source.content : `/${source.commandName}`;

                await source.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))],
                    allowedMentions: { repliedUser: false }
                }).catch((error) => {
                    bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
                });

                return { valid: false, errorSent: true };
            }
        }

        return { valid: true };
    }

    /**
     * Validate if user has DJ permission for DJ commands
     */
    public static async validateDJPermission(
        bot: Bot,
        client: Client,
        source: Message | ChatInputCommandInteraction,
        command: BaseCommand,
        userId: string,
        member: GuildMember,
        guildId: string
    ): Promise<ValidationResult> {
        const metadata = command.getMetadata(bot);

        if (bot.config.command.djCommand.includes(metadata.name)) {
            const player = client.lavashark.getPlayer(guildId);

            if (!PermissionManager.hasDJCommandPermission(bot, userId, member, player || undefined)) {
                const username = source instanceof Message ? source.author.username : source.user.username;
                const content = source instanceof Message ? source.content : `/${source.commandName}`;

                await source.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))],
                    allowedMentions: { repliedUser: false }
                }).catch((error) => {
                    bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
                });

                return { valid: false, errorSent: true };
            }
        }

        return { valid: true };
    }

    /**
     * Validate voice channel requirements
     */
    public static async validateVoiceChannel(
        bot: Bot,
        client: Client,
        source: Message | ChatInputCommandInteraction,
        command: BaseCommand,
        member: GuildMember,
        guildId: string
    ): Promise<ValidationResult> {
        const metadata = command.getMetadata(bot);

        if (!metadata.voiceChannel) {
            return { valid: true };
        }

        const voiceChannel = member.voice.channel;
        const username = source instanceof Message ? source.author.username : source.user.username;
        const content = source instanceof Message ? source.content : `/${source.commandName}`;

        // Check if user is in voice channel
        if (!voiceChannel) {
            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
            });

            return { valid: false, errorSent: true };
        }

        // Check if user is in specified voice channel
        if (bot.config.bot.specifyVoiceChannel && voiceChannel.id !== bot.config.bot.specifyVoiceChannel) {
            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERRPR_NOT_IN_SPECIFIC_VOICE_CHANNEL', {
                    channelId: bot.config.bot.specifyVoiceChannel
                }))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
            });

            return { valid: false, errorSent: true };
        }

        // Check if user is in same voice channel as bot
        const guild = await client.guilds.fetch(guildId);
        if (guild.members.me?.voice.channel && voiceChannel.id !== guild.members.me.voice.channelId) {
            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, `Error reply: (${username} : ${content}) ${error}`);
            });

            return { valid: false, errorSent: true };
        }

        return { valid: true };
    }

    /**
     * Ensure guild and member data is in cache
     */
    public static async ensureGuildCache(
        bot: Bot,
        client: Client,
        source: Message | ChatInputCommandInteraction,
        guildId: string,
        userId: string
    ): Promise<ValidationResult> {
        let guild;

        // Ensure guild data is in cache
        try {
            guild = await client.guilds.fetch(guildId);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `Error fetching guild (${guildId}): ${error}`);
            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))],
                allowedMentions: { repliedUser: false }
            });
            return { valid: false, errorSent: true };
        }

        // Ensure member is in cache
        try {
            await guild.members.fetch(userId);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `Error fetching member (${userId}): ${error}`);
            await source.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))],
                allowedMentions: { repliedUser: false }
            });
            return { valid: false, errorSent: true };
        }

        return { valid: true };
    }
}
