import { ComponentType, MessageFlags } from 'discord.js';

import { PlaylistButtonId } from '../../@types/index.js';
import { embeds } from '../../embeds/index.js';

import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';
import type { PlaylistOverwriteAction } from '../../embeds/playlist.embed.js';
import type { PlaylistManager } from '../../lib/PlaylistManager.js';
import type { CommandContext } from '../base/CommandContext.js';


/**
 * Supported playlist subcommand names
 */
export type PlaylistSubcommandName =
    | 'delete'
    | 'import'
    | 'info'
    | 'list'
    | 'play'
    | 'remove-track'
    | 'save'
    | 'toggle-m3u';

/**
 * Dependencies shared by playlist subcommand executions
 */
export interface PlaylistSubcommandContext {
    bot: Bot;
    client: Client;
    command: CommandContext;
    playlistManager: PlaylistManager;
}

const CONFIRMATION_TIMEOUT_MS = 30_000;

/**
 * Base contract and shared behavior for playlist subcommands.
 */
export abstract class BasePlaylistSubcommand {
    public abstract readonly name: PlaylistSubcommandName;

    /**
     * Execute the playlist subcommand
     */
    public abstract execute(context: PlaylistSubcommandContext): Promise<void>;

    /**
     * Read a playlist name from message arguments or slash command options
     */
    protected getPlaylistName(command: CommandContext): string {
        const value = command.isMessage()
            ? command.args.slice(1).join(' ')
            : command.getStringOption('name');
        return value?.trim() ?? '';
    }

    /**
     * Read the playlist name and remote URL used by the import subcommand
     */
    protected getImportArguments(
        command: CommandContext,
    ): { name: string; url: string } | null {
        if (command.isInteraction()) {
            const name = command.getStringOption('name')?.trim();
            const url = command.getStringOption('url')?.trim();
            return name && url ? { name, url } : null;
        }

        const url = command.args.at(-1)?.trim();
        const name = command.args.slice(1, -1).join(' ').trim();
        return name && url ? { name, url } : null;
    }

    /**
     * Read the playlist name and one-based track index used for removal
     */
    protected getRemoveTrackArguments(
        command: CommandContext,
    ): { index: number; name: string } | null {
        if (command.isInteraction()) {
            const name = command.getStringOption('name')?.trim();
            const index = command.getIntegerOption('index');
            return name && index !== null ? { index, name } : null;
        }

        const index = Number.parseInt(command.args.at(-1) ?? '', 10);
        const name = command.args.slice(1, -1).join(' ').trim();
        return name && Number.isInteger(index) ? { index, name } : null;
    }

    /**
     * Ask the command user to confirm replacing an existing playlist
     */
    protected async confirmOverwrite(
        context: PlaylistSubcommandContext,
        action: PlaylistOverwriteAction,
        name: string,
        trackCount: number,
    ): Promise<boolean> {
        const { bot, command } = context;
        const confirmId = action === 'save'
            ? PlaylistButtonId.SaveConfirm
            : PlaylistButtonId.ImportConfirm;
        // Send one confirmation message for both save and import workflows
        const message = await command.reply({
            embeds: [embeds.playlistOverwrite(
                bot,
                action,
                name,
                trackCount,
                command.language,
            )],
            components: [embeds.playlistOverwriteButtons(
                bot,
                action,
                command.language,
            )],
        });
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: CONFIRMATION_TIMEOUT_MS,
        });

        return await new Promise<boolean>((resolve) => {
            let settled = false;

            collector.on('collect', async (interaction) => {
                // Only the user who invoked the command may confirm the action
                if (interaction.user.id !== command.user.id) {
                    await interaction.reply({
                        content: command.t(
                            'commands:ERROR_ONLY_COMMAND_USER_CONFIRM',
                        ),
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                const confirmed = interaction.customId === confirmId;
                settled = true;
                const cancelKey = action === 'save'
                    ? 'commands:MESSAGE_PLAYLIST_SAVE_CANCELLED'
                    : 'commands:MESSAGE_PLAYLIST_IMPORT_CANCELLED';

                try {
                    await interaction.update({
                        content: command.t(confirmed
                            ? 'commands:MESSAGE_PLAYLIST_OVERWRITING'
                            : cancelKey),
                        components: [],
                        embeds: [],
                    });
                } catch (error) {
                    this.logInteractionError(context, 'update', error);
                }

                collector.stop();
                resolve(confirmed);
            });

            collector.on('end', async (_collected, reason) => {
                // Replace expired controls with a localized timeout message
                if (settled) return;
                settled = true;

                if (reason === 'time') {
                    const timeoutKey = action === 'save'
                        ? 'commands:MESSAGE_PLAYLIST_SAVE_TIMEOUT'
                        : 'commands:MESSAGE_PLAYLIST_IMPORT_TIMEOUT';
                    try {
                        await message.edit({
                            content: command.t(timeoutKey),
                            components: [],
                            embeds: [],
                        });
                    } catch (error) {
                        this.logInteractionError(context, 'expire', error);
                    }
                }

                resolve(false);
            });
        });
    }

    /**
     * Log failures raised after the command execution stack has returned
     */
    private logInteractionError(
        context: PlaylistSubcommandContext,
        action: string,
        error: unknown,
    ): void {
        context.bot.logger.error(
            context.bot.shardId,
            `[PlaylistCommand] Failed to ${action} interaction: ${error}`,
        );
    }
}
