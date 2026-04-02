import { Events, GuildMember, Interaction, MessageFlags } from 'discord.js';

import { BaseDiscordEvent } from './base/BaseDiscordEvent.js';
import { cst } from '../../utils/constants.js';
import { embeds } from '../../embeds/index.js';
import { CommandContext } from '../../commands/base/CommandContext.js';
import { CommandValidator } from './base/CommandValidator.js';
import { PlayPauseButtonHandler } from '../../lib/handlers/PlayPauseButtonHandler.js';
import { SkipButtonHandler } from '../../lib/handlers/SkipButtonHandler.js';
import { LoopButtonHandler } from '../../lib/handlers/LoopButtonHandler.js';
import { StopButtonHandler } from '../../lib/handlers/StopButtonHandler.js';
import { ShuffleButtonHandler } from '../../lib/handlers/ShuffleButtonHandler.js';
import { MusicSaveButtonHandler } from '../../lib/handlers/MusicSaveButtonHandler.js';
import { QueueButtonHandler } from '../../lib/handlers/QueueButtonHandler.js';
import { DashboardButtonId, QueueButtonId, MusicButtonId } from '../../@types/index.js';

import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * InteractionCreate event handler
 * Handles slash commands and button interactions
 */
export class InteractionCreateEvent extends BaseDiscordEvent<Events.InteractionCreate> {
    public getEventName(): Events.InteractionCreate {
        return Events.InteractionCreate;
    }

    public async execute(bot: Bot, client: Client, interaction: Interaction): Promise<void> {
        // Basic validation
        if (!interaction.guild || !interaction.guild.members) return;
        if (interaction.user.bot) return;
        const isBlacklisted = bot.config.blacklist.includes(interaction.user.id) || (bot.blacklistManager?.has(interaction.user.id) ?? false);
        if (isBlacklisted) return;

        if (interaction.isButton()) {
            await this.#handleButtonInteraction(bot, client, interaction);
        }
        else if (interaction.isCommand() && interaction.inGuild() && interaction.isChatInputCommand()) {
            await this.#handleCommandInteraction(bot, client, interaction);
        }
    }

    /**
     * Handle button interactions (dashboard, queue, etc.)
     * @private
     */
    async #handleButtonInteraction(bot: Bot, client: Client, interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember?.voice.channel;

        // Validate voice channel
        if (!voiceChannel) {
            await interaction.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'))],
                flags: MessageFlags.Ephemeral,
                components: []
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
            });
            return;
        }

        if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            await interaction.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'))],
                flags: MessageFlags.Ephemeral,
                components: []
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
            });
            return;
        }

        // Get player
        const player = client.lavashark.getPlayer(interaction.guild!.id);

        if (!player) {
            await interaction.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_PLAYING'))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
            });
            return;
        }

        // Handle button action
        try {
            switch (interaction.customId) {
                case DashboardButtonId.PlayPause: {
                    await PlayPauseButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Skip: {
                    await SkipButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Loop: {
                    await LoopButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Stop: {
                    await StopButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Shuffle: {
                    await ShuffleButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case MusicButtonId.Save: {
                    await MusicSaveButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Previous: {
                    await QueueButtonHandler.handlePreviousPage(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Next: {
                    await QueueButtonHandler.handleNextPage(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Delete: {
                    await QueueButtonHandler.handleDelete(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Clear: {
                    await QueueButtonHandler.handleClear(bot, client, interaction, player);
                    break;
                }
            }
        }
        catch (error) {
            bot.logger.emit('error', bot.shardId, '[interactionCreate] Dashboard error: ' + error);
        }
    }

    /**
     * Handle slash command interactions
     * @private
     */
    async #handleCommandInteraction(bot: Bot, client: Client, interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        // Check if slash commands are enabled
        if (!bot.config.bot.slashCommand) {
            await interaction.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_SLASH_NOT_ENABLE'))],
                allowedMentions: { repliedUser: false }
            }).catch((error) => {
                bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName}) ${error}`);
            });
            return;
        }

        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;

        // Validate message channel
        const channelValidation = await CommandValidator.validateMessageChannel(
            bot,
            client,
            interaction,
            interaction.channelId
        );
        if (!channelValidation.valid) return;

        // Validate admin permission
        const adminValidation = await CommandValidator.validateAdminPermission(
            bot,
            client,
            interaction,
            cmd,
            interaction.user.id
        );
        if (!adminValidation.valid) return;

        // Validate DJ permission
        const djValidation = await CommandValidator.validateDJPermission(
            bot,
            client,
            interaction,
            cmd,
            interaction.user.id,
            interaction.member as GuildMember,
            interaction.guild!.id
        );
        if (!djValidation.valid) return;

        // Validate voice channel
        const voiceValidation = await CommandValidator.validateVoiceChannel(
            bot,
            client,
            interaction,
            cmd,
            interaction.member as GuildMember,
            interaction.guild!.id
        );
        if (!voiceValidation.valid) return;

        // Log command execution
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        bot.logger.emit(
            'discord',
            bot.shardId,
            `[interactionCreate] (${cst.color.grey}${guildMember?.guild.name}${cst.color.white}) ${interaction.user.username} : /${interaction.commandName}`
        );

        // Ensure guild cache
        const cacheValidation = await CommandValidator.ensureGuildCache(
            bot,
            client,
            interaction,
            interaction.guildId!,
            interaction.user.id
        );
        if (!cacheValidation.valid) return;

        // Defer reply
        try {
            await interaction.deferReply();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, '[interactionCreate] Error deferReply: ' + error);
        }

        // Execute command
        const context = new CommandContext(interaction);
        await cmd.execute(bot, client, context);
    }
}
