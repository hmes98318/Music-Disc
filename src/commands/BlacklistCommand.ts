import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


/**
 * Blacklist command - Manage the dynamic bot blacklist (admin-only)
 */
export class BlacklistCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'blacklist',
            aliases: [],
            description: i18next.t('commands:CONFIG_BLACKLIST_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_BLACKLIST_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'add',
                    description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_SUBCOMMAND'),
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'user',
                            description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_USER'),
                            type: 6, // USER
                            required: true
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_SUBCOMMAND'),
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'user',
                            description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_USER'),
                            type: 6, // USER
                            required: true
                        }
                    ]
                },
                {
                    name: 'list',
                    description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_SUBCOMMAND'),
                    type: 1 // SUB_COMMAND
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        if (!bot.blacklistManager) {
            await context.replyEphemeralError(bot, 'Blacklist manager is not initialized.');
            return;
        }

        // Handle text command
        if (context.isMessage()) {
            await this.#handleTextCommand(bot, client, context);
            return;
        }

        // Handle slash command with subcommands
        const interaction = context.getInteraction();
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add': {
                const user = interaction.options.getUser('user', true);
                await this.#addUser(bot, client, context, user.id);
                break;
            }
            case 'remove': {
                const user = interaction.options.getUser('user', true);
                await this.#removeUser(bot, client, context, user.id);
                break;
            }
            case 'list': {
                await this.#listUsers(bot, client, context);
                break;
            }
        }
    }

    /**
     * Handle text command (e.g., +blacklist add @user, +blacklist remove @user, +blacklist list)
     */
    async #handleTextCommand(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const args = context.args;
        const action = args[0]?.toLowerCase();

        if (!action || !['add', 'remove', 'list'].includes(action)) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:CONFIG_BLACKLIST_USAGE'));
            return;
        }

        if (action === 'list') {
            await this.#listUsers(bot, client, context);
            return;
        }

        // Extract user ID from mention or raw ID
        const userArg = args[1];
        if (!userArg) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:CONFIG_BLACKLIST_USAGE'));
            return;
        }

        const userId = userArg.replace(/[<@!>]/g, '');

        if (action === 'add') {
            await this.#addUser(bot, client, context, userId);
        } else {
            await this.#removeUser(bot, client, context, userId);
        }
    }

    async #addUser(bot: Bot, _client: Client, context: CommandContext, userId: string): Promise<void> {
        const success = bot.blacklistManager!.add(userId);
        if (success) {
            await context.replySuccess(bot, _client.i18n.t('commands:MESSAGE_BLACKLIST_ADDED', { userId }));
        } else {
            await context.replyEphemeralError(bot, _client.i18n.t('commands:MESSAGE_BLACKLIST_ALREADY_LISTED', { userId }));
        }
    }

    async #removeUser(bot: Bot, _client: Client, context: CommandContext, userId: string): Promise<void> {
        const success = bot.blacklistManager!.remove(userId);
        if (success) {
            await context.replySuccess(bot, _client.i18n.t('commands:MESSAGE_BLACKLIST_REMOVED', { userId }));
        } else {
            await context.replyEphemeralError(bot, _client.i18n.t('commands:MESSAGE_BLACKLIST_NOT_LISTED', { userId }));
        }
    }

    async #listUsers(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const users = bot.blacklistManager!.getAll();

        if (users.length === 0) {
            await context.replyText(bot, _client.i18n.t('commands:MESSAGE_BLACKLIST_LIST_EMPTY'));
            return;
        }

        const userList = users.map(id => `<@${id}>`).join('\n');
        const { EmbedBuilder } = await import('discord.js');

        const embed = new EmbedBuilder()
            .setColor(bot.config.bot.embedsColors.message as any)
            .setTitle(_client.i18n.t('commands:MESSAGE_BLACKLIST_LIST_TITLE'))
            .setDescription(userList)
            .setTimestamp();

        await context.reply({ embeds: [embed] });
    }
}
