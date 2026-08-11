import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

import type { ApplicationCommandSubCommandData, Client } from 'discord.js';
import type { Bot, CommandMetadata } from '../@types/index.js';
import type { BlacklistManager } from '../lib/BlacklistManager.js';
import type { CommandContext } from './base/CommandContext.js';


type BlacklistAction = 'add' | 'list' | 'remove';
type BlacklistMutationAction = Exclude<BlacklistAction, 'list'>;

const BLACKLIST_ACTIONS = new Set<BlacklistAction>(['add', 'list', 'remove']);
const DISCORD_USER_ID_PATTERN = /^[1-9]\d{16,18}$/;

/**
 * Manage the persistent bot blacklist
 */
export class BlacklistCommand extends BaseCommand {
    /**
     * Build blacklist command metadata and slash command options
     */
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            aliases: [],
            category: CommandCategory.UTILITY,
            description: i18next.t('commands:CONFIG_BLACKLIST_DESCRIPTION'),
            name: 'blacklist',
            options: [
                this.createUserSubcommand(
                    'add',
                    'commands:CONFIG_BLACKLIST_OPTION_ADD',
                ),
                this.createUserSubcommand(
                    'remove',
                    'commands:CONFIG_BLACKLIST_OPTION_REMOVE',
                ),
                {
                    description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_LIST'),
                    name: 'list',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
            sendTyping: true,
            showHelp: true,
            usage: i18next.t('commands:CONFIG_BLACKLIST_USAGE'),
            voiceChannel: false,
        };
    }

    /**
     * Resolve and execute the requested blacklist action
     */
    protected async run(
        bot: Bot,
        _client: Client,
        context: CommandContext,
    ): Promise<void> {
        const blacklistManager = bot.blacklistManager;
        if (!blacklistManager) {
            await context.replyEphemeralError(
                bot,
                context.t('commands:ERROR_BLACKLIST_NOT_INITIALIZED'),
            );
            return;
        }

        const action = this.getAction(context);
        if (!action) {
            await this.replyWithUsage(bot, context);
            return;
        }

        if (action === 'list') {
            await this.listUsers(bot, blacklistManager, context);
            return;
        }

        const userId = this.getTargetUserId(context);
        if (!userId) {
            await this.replyWithUsage(bot, context);
            return;
        }

        if (action === 'add') {
            await this.addUser(bot, blacklistManager, context, userId);
        } else {
            await this.removeUser(bot, blacklistManager, context, userId);
        }
    }

    /**
     * Create an add or remove subcommand with a required user option
     */
    private createUserSubcommand(
        name: BlacklistMutationAction,
        descriptionKey: string,
    ): ApplicationCommandSubCommandData {
        return {
            description: i18next.t(descriptionKey),
            name,
            options: [
                {
                    description: i18next.t('commands:CONFIG_BLACKLIST_OPTION_USER'),
                    name: 'user',
                    required: true,
                    type: ApplicationCommandOptionType.User,
                },
            ],
            type: ApplicationCommandOptionType.Subcommand,
        };
    }

    /**
     * Read and validate the action from either command source
     */
    private getAction(context: CommandContext): BlacklistAction | null {
        const value = context.isMessage()
            ? context.args[0]?.toLowerCase()
            : context.getInteraction().options.getSubcommand(false);
        return BLACKLIST_ACTIONS.has(value as BlacklistAction)
            ? value as BlacklistAction
            : null;
    }

    /**
     * Resolve the target user from a slash option, mention, or raw ID
     */
    private getTargetUserId(context: CommandContext): string | null {
        if (context.isInteraction()) {
            return context.getInteraction().options.getUser('user', false)?.id ?? null;
        }

        const mentionedUser = context.getMessage().mentions.users.first();
        if (mentionedUser) return mentionedUser.id;

        const rawValue = context.args[1];
        return rawValue && DISCORD_USER_ID_PATTERN.test(rawValue)
            ? rawValue
            : null;
    }

    /**
     * Add one user to the persistent blacklist
     */
    private async addUser(
        bot: Bot,
        blacklistManager: BlacklistManager,
        context: CommandContext,
        userId: string,
    ): Promise<void> {
        if (blacklistManager.add(userId)) {
            await context.replySuccess(
                bot,
                context.t('commands:MESSAGE_BLACKLIST_ADDED', { userId }),
            );
            return;
        }

        await context.replyEphemeralError(
            bot,
            context.t('commands:MESSAGE_BLACKLIST_ALREADY_LISTED', { userId }),
        );
    }

    /**
     * Remove one user from the persistent blacklist
     */
    private async removeUser(
        bot: Bot,
        blacklistManager: BlacklistManager,
        context: CommandContext,
        userId: string,
    ): Promise<void> {
        if (blacklistManager.remove(userId)) {
            await context.replySuccess(
                bot,
                context.t('commands:MESSAGE_BLACKLIST_REMOVED', { userId }),
            );
            return;
        }

        await context.replyEphemeralError(
            bot,
            context.t('commands:MESSAGE_BLACKLIST_NOT_LISTED', { userId }),
        );
    }

    /**
     * Display all users in the persistent blacklist
     */
    private async listUsers(
        bot: Bot,
        blacklistManager: BlacklistManager,
        context: CommandContext,
    ): Promise<void> {
        const userIds = blacklistManager.getAll();
        if (userIds.length === 0) {
            await context.replyText(
                bot,
                context.t('commands:MESSAGE_BLACKLIST_LIST_EMPTY'),
            );
            return;
        }

        await context.reply({
            embeds: [embeds.blacklistList(bot, userIds, context.language)],
        });
    }

    /**
     * Reply with localized blacklist command usage
     */
    private async replyWithUsage(
        bot: Bot,
        context: CommandContext,
    ): Promise<void> {
        await context.replyEphemeralError(
            bot,
            context.t('commands:CONFIG_BLACKLIST_USAGE'),
        );
    }
}
