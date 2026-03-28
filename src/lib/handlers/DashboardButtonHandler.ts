import { PermissionManager } from '../PermissionManager.js';
import { embeds } from '../../embeds/index.js';
import type { Client, ButtonInteraction, GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Base class for dashboard button handlers
 * Provides common permission checking and error handling
 */
export abstract class DashboardButtonHandler {
    /**
     * Check if user has permission to execute the command
     * @static
     * @param {Bot} bot - Bot instance
     * @param {Client} client - Discord client
     * @param {ButtonInteraction} interaction - Button interaction
     * @param {string} commandName - Command name to check permission for
     * @param {Player} player - Player instance
     * @returns {Promise<boolean>} true if user has permission, false otherwise
     */
    protected static async checkPermission(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        commandName: string,
        player: Player
    ): Promise<boolean> {
        // Check admin permission
        if (bot.config.command.adminCommand.includes(commandName)) {
            if (!bot.config.bot.admin.includes(interaction.user.id)) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))],
                    ephemeral: true
                });
                return false;
            }
        }

        // Check DJ permission
        if (bot.config.command.djCommand.includes(commandName)) {
            const member = interaction.member as GuildMember;
            if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, member, player)) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))],
                    ephemeral: true
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Handle button interaction
     * @static
     * @param bot - Bot instance
     * @param client - Discord client
     * @param interaction - Button interaction
     * @param player - Player instance
     */
    public static async handle(
        _bot: Bot,
        _client: Client,
        _interaction: ButtonInteraction,
        _player: Player
    ): Promise<void> {
        throw new Error('handle() method must be implemented by subclass');
    }
}
