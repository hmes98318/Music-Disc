import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { DeletePlaylistSubcommand } from './playlist/DeletePlaylistSubcommand.js';
import { ImportPlaylistSubcommand } from './playlist/ImportPlaylistSubcommand.js';
import { ListPlaylistsSubcommand } from './playlist/ListPlaylistsSubcommand.js';
import { PlayPlaylistSubcommand } from './playlist/PlayPlaylistSubcommand.js';
import { RemovePlaylistTrackSubcommand } from './playlist/RemovePlaylistTrackSubcommand.js';
import { SavePlaylistSubcommand } from './playlist/SavePlaylistSubcommand.js';
import { ShowPlaylistInfoSubcommand } from './playlist/ShowPlaylistInfoSubcommand.js';
import { ToggleM3uSubcommand } from './playlist/ToggleM3uSubcommand.js';

import type {
    ApplicationCommandStringOptionData,
    ApplicationCommandSubCommandData,
    Client,
} from 'discord.js';
import type { Bot, CommandMetadata } from '../@types/index.js';
import type { CommandContext } from './base/CommandContext.js';
import type {
    BasePlaylistSubcommand,
    PlaylistSubcommandName,
} from './playlist/BasePlaylistSubcommand.js';


/**
 * Coordinate playlist subcommands for message and slash command requests
 */
export class PlaylistCommand extends BaseCommand {
    readonly #subcommands: BasePlaylistSubcommand[] = [
        new DeletePlaylistSubcommand(),
        new ImportPlaylistSubcommand(),
        new ListPlaylistsSubcommand(),
        new PlayPlaylistSubcommand(),
        new RemovePlaylistTrackSubcommand(),
        new SavePlaylistSubcommand(),
        new ShowPlaylistInfoSubcommand(),
        new ToggleM3uSubcommand(),
    ];

    /**
     * Build playlist command metadata and slash command options
     */
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            aliases: ['pl'],
            category: CommandCategory.MUSIC,
            description: i18next.t('commands:CONFIG_PLAYLIST_DESCRIPTION'),
            name: 'playlist',
            options: [
                this.createNamedSubcommand(
                    'save',
                    'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_SAVE',
                ),
                this.createNamedSubcommand(
                    'play',
                    'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_PLAY',
                ),
                {
                    description: i18next.t(
                        'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_LIST',
                    ),
                    name: 'list',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                this.createNamedSubcommand(
                    'info',
                    'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_INFO',
                    false,
                ),
                this.createNamedSubcommand(
                    'delete',
                    'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_DELETE',
                ),
                {
                    description: i18next.t(
                        'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_IMPORT',
                    ),
                    name: 'import',
                    options: [
                        this.createNameOption(),
                        {
                            description: i18next.t(
                                'commands:CONFIG_PLAYLIST_OPTION_URL',
                            ),
                            name: 'url',
                            required: true,
                            type: ApplicationCommandOptionType.String,
                        },
                    ],
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    description: i18next.t(
                        'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_REMOVE_TRACK',
                    ),
                    name: 'remove-track',
                    options: [
                        this.createNameOption(),
                        {
                            description: i18next.t(
                                'commands:CONFIG_PLAYLIST_OPTION_INDEX',
                            ),
                            name: 'index',
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                        },
                    ],
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    description: i18next.t(
                        'commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_TOGGLE_M3U',
                    ),
                    name: 'toggle-m3u',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
            sendTyping: true,
            showHelp: true,
            usage: i18next.t('commands:CONFIG_PLAYLIST_USAGE'),
            voiceChannel: false,
        };
    }

    /**
     * Resolve and execute the requested playlist subcommand
     */
    protected async run(
        bot: Bot,
        client: Client,
        command: CommandContext,
    ): Promise<void> {
        if (bot.config.playlist?.enabled === false) {
            await command.replyEphemeralError(
                bot,
                command.t('commands:ERROR_PLAYLIST_DISABLED'),
            );
            return;
        }

        // Ensure playlist storage is available before dispatching
        const playlistManager = bot.playlistManager;
        if (!playlistManager) {
            await command.replyEphemeralError(
                bot,
                command.t('commands:ERROR_PLAYLIST_NOT_INITIALIZED'),
            );
            return;
        }

        // Normalize the subcommand name from either command source (default to 'list')
        const name = (
            command.isMessage()
                ? command.args[0]?.toLowerCase()
                : command.getInteraction().options.getSubcommand(false)
        ) || 'list';

        // Find the matching OOP subcommand implementation
        const subcommand = this.#subcommands.find(
            (candidate) => candidate.name === name,
        );
        if (!subcommand) {
            await command.replyEphemeralError(
                bot,
                command.t('commands:ERROR_PLAYLIST_SUBCOMMAND_UNKNOWN'),
            );
            return;
        }

        await subcommand.execute({ bot, client, command, playlistManager });
    }

    /**
     * Create a subcommand that requires a playlist name
     */
    private createNamedSubcommand(
        name: PlaylistSubcommandName,
        descriptionKey: string,
        nameRequired: boolean = true,
    ): ApplicationCommandSubCommandData {
        return {
            description: i18next.t(descriptionKey),
            name,
            options: [this.createNameOption(nameRequired)],
            type: ApplicationCommandOptionType.Subcommand,
        };
    }

    /**
     * Create the shared playlist name option
     */
    private createNameOption(required: boolean = true): ApplicationCommandStringOptionData {
        return {
            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
            name: 'name',
            required,
            type: ApplicationCommandOptionType.String,
        };
    }
}
