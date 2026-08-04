import i18next from 'i18next';
import { ApplicationCommandOptionType, ButtonBuilder } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';
import { QueueLimitManager } from '../lib/QueueLimitManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';
import type { PlaylistTrack } from '../lib/PlaylistManager.js';

export class PlaylistCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'playlist',
            aliases: ['pl'],
            description: i18next.t('commands:CONFIG_PLAYLIST_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_PLAYLIST_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'save',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_SAVE'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'play',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_PLAY'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'list',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_LIST'),
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: 'info',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_INFO'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'delete',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_DELETE'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'import',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_IMPORT'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'url',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_URL'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'remove-track',
                    description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_SUBCOMMAND_REMOVE_TRACK'),
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_NAME'),
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'index',
                            description: i18next.t('commands:CONFIG_PLAYLIST_OPTION_INDEX'),
                            type: ApplicationCommandOptionType.Integer,
                            required: true
                        }
                    ]
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        if (!bot.playlistManager) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_INITIALIZED'));
            return;
        }

        const subcommand = context.isMessage()
            ? context.args[0]?.toLowerCase()
            : context.getInteraction().options.getSubcommand();

        if (!subcommand) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_SUBCOMMAND_INVALID'));
            return;
        }

        switch (subcommand) {
            case 'save':
                await this.#handleSave(bot, client, context);
                break;
            case 'play':
                await this.#handlePlay(bot, client, context);
                break;
            case 'list':
                await this.#handleList(bot, client, context);
                break;
            case 'info':
                await this.#handleInfo(bot, client, context);
                break;
            case 'delete':
                await this.#handleDelete(bot, client, context);
                break;
            case 'import':
                await this.#handleImport(bot, client, context);
                break;
            case 'remove-track':
                await this.#handleRemoveTrack(bot, client, context);
                break;
            default:
                await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_SUBCOMMAND_UNKNOWN'));
        }
    }

    async #handleSave(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const player = client.lavashark.getPlayer(guildId);

        if (!player || !player.current) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NO_PLAYING'));
            return;
        }

        const name = context.isMessage()
            ? context.args.slice(1).join(' ')
            : context.getInteraction().options.getString('name', true);

        if (!name) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'));
            return;
        }

        const tracks: Omit<PlaylistTrack, 'position'>[] = [];

        const serializeTrack = (t: any) => ({
            title: t.title,
            url: t.uri,
            encoded: t.encoded || null,
            author: t.author || null,
            duration: typeof t.duration === 'number' ? t.duration : 0
        });

        tracks.push(serializeTrack(player.current));

        for (const track of player.queue.tracks) {
            tracks.push(serializeTrack(track));
        }

        const success = bot.playlistManager!.saveCurrentQueue(guildId, name, tracks);

        if (success) {
            await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_SAVE_SUCCESS', { count: tracks.length, name }));
        } else {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_SAVE_FAILED'));
        }
    }

    async #handlePlay(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const name = context.isMessage()
            ? context.args.slice(1).join(' ')
            : context.getInteraction().options.getString('name', true);

        if (!name) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'));
            return;
        }

        const playlist = bot.playlistManager!.getPlaylist(guildId, name);
        if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }));
            return;
        }

        const member = context.isMessage()
            ? context.getMessage().member as GuildMember | null
            : context.getInteraction().member as GuildMember | null;

        const voiceChannel = member?.voice.channel;
        if (!voiceChannel) {
            await context.replyEphemeralError(bot, context.t('events:ERROR_NOT_IN_VOICE_CHANNEL'));
            return;
        }

        const tracksToPlay = playlist.tracks;

        let player = client.lavashark.getPlayer(guildId);
        if (!player) {
            player = client.lavashark.createPlayer({
                guildId: guildId,
                voiceChannelId: voiceChannel.id,
                textChannelId: context.channel!.id,
                selfDeaf: true
            });
        }

        if (!player.setting) {
            player.setting = {
                queuePage: null,
                volume: null,
                fairQueueRotation: []
            };
        }

        const metadata = context.isMessage() ? context.getMessage() : context.getInteraction();

        try {
            await player.connect();
            player.metadata = metadata;
        } catch (error) {
            bot.logger.error(bot.shardId, 'Error joining channel: ' + error);
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAY_JOIN_CHANNEL'));
            return;
        }

        try {
            if (!player.dashboardMsg) {
                await client.dashboard.initialize(metadata, player);
            }
        } catch (error) {
            await client.dashboard.destroy(player);
        }

        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(player)) {
            const isAdmin = bot.config.bot.admin.includes(context.user.id);
            const hasDJRoleUser = voiceChannel.isVoiceBased() ? DJManager.hasDJRoleInChannel(bot, voiceChannel) : false;

            if (!isAdmin && !hasDJRoleUser) {
                DJManager.addDJ(player, context.user.id);
            }
        }

        const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
        const curVolume = player.setting.volume ?? bot.guildVolumeManager?.get(player.guildId) ?? bot.config.bot.volume.default;

        let addedCount = 0;
        let skipCount = 0;

        await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_LOAD_START', { name, count: tracksToPlay.length }));

        for (const pt of tracksToPlay) {
            try {
                const userLimit = QueueLimitManager.getUserLimit(bot, requester.id, member, player);
                const currentCount = QueueLimitManager.countUserSongsInQueue(player, requester.id);
                if (bot.config.bot.maxQueuedSongs.enabled && currentCount >= userLimit) {
                    skipCount++;
                    continue;
                }

                let searchResult = null;
                if (pt.encoded) {
                    try {
                        searchResult = await client.lavashark.search(pt.encoded);
                    } catch (_) {}
                }

                if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                    try {
                        searchResult = await client.lavashark.search(pt.url);
                    } catch (_) {}
                }

                if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                    try {
                        searchResult = await client.lavashark.search(`ytsearch:${pt.title}`);
                    } catch (_) {}
                }

                if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
                    const track = searchResult.tracks[0];
                    (track as any).requester = requester;
                    player.addTracks(track, requester as any);
                    addedCount++;
                } else {
                    skipCount++;
                }
            } catch (err) {
                bot.logger.error(bot.shardId, `Error loading track ${pt.title}: ${err}`);
                skipCount++;
            }
        }

        if (addedCount > 0) {
            if (!player.playing) {
                player.filters.setVolume(curVolume);
                await player.play().catch(async (error) => {
                    bot.logger.error(bot.shardId, 'Error playing track: ' + error);
                    return player!.destroy();
                });
            } else if (player.current) {
                await client.dashboard.update(player, player.current);
            }
        }

        if (bot.config.queuePersistence.enabled && client.queuePersistence) {
            await client.queuePersistence.saveQueue(player);
        }

        if (context.channel && 'send' in context.channel) {
            await (context.channel as any).send({
                content: context.t('commands:MESSAGE_PLAYLIST_LOAD_COMPLETE', { name, added: addedCount, skipped: skipCount })
            });
        }
    }

    async #handleList(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const playlists = bot.playlistManager!.getPlaylists(guildId);

        if (playlists.length === 0) {
            await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_LIST_EMPTY'));
            return;
        }

        const { EmbedBuilder } = await import('discord.js');
        const embed = new EmbedBuilder()
            .setColor(bot.config.bot.embedsColors.message as any)
            .setTitle(context.t('commands:MESSAGE_PLAYLIST_LIST_TITLE'))
            .setDescription(playlists.map((p, i) => `**${i + 1}.** \`${p.name}\` (${p.trackCount}) - <t:${Math.floor(p.createdAt / 1000)}:R>`).join('\n'))
            .setTimestamp();

        await context.reply({ embeds: [embed] });
    }

    async #handleInfo(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const name = context.isMessage()
            ? context.args.slice(1).join(' ')
            : context.getInteraction().options.getString('name', true);

        if (!name) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'));
            return;
        }

        const playlist = bot.playlistManager!.getPlaylist(guildId, name);
        if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }));
            return;
        }

        const tracks = playlist.tracks;
        const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = await import('discord.js');
        const pageSize = 10;
        const totalPages = Math.ceil(tracks.length / pageSize);
        let currentPage = 1;

        const buildEmbed = (page: number) => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageTracks = tracks.slice(start, end);

            const listText = pageTracks
                .map((t, i) => `**${start + i + 1}.** [${t.title}](${t.url})`)
                .join('\n');

            return new EmbedBuilder()
                .setColor(bot.config.bot.embedsColors.message as any)
                .setTitle(context.t('commands:MESSAGE_PLAYLIST_INFO_TITLE', { name, count: tracks.length }))
                .setDescription(listText)
                .setFooter({ text: context.t('commands:MESSAGE_FOOTER_PAGE', { page, totalPages }) })
                .setTimestamp();
        };

        const buildButtons = (page: number) => {
            return new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('pl_prev')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page <= 1),
                new ButtonBuilder()
                    .setCustomId('pl_next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages)
            );
        };

        const initialEmbed = buildEmbed(currentPage);
        const components = totalPages > 1 ? [buildButtons(currentPage)] : [];

        const msg = await context.reply({
            embeds: [initialEmbed],
            components,
            allowedMentions: { repliedUser: false }
        });

        if (totalPages <= 1 || !msg) return;

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== context.user.id) {
                await i.reply({ content: context.t('commands:ERROR_ONLY_COMMAND_USER_PAGINATE'), flags: 64 });
                return;
            }

            if (i.customId === 'pl_prev' && currentPage > 1) {
                currentPage--;
            } else if (i.customId === 'pl_next' && currentPage < totalPages) {
                currentPage++;
            }

            await i.update({
                embeds: [buildEmbed(currentPage)],
                components: [buildButtons(currentPage)]
            });
        });

        collector.on('end', async () => {
            try {
                const disabledButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('pl_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('pl_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                await msg.edit({ components: [disabledButtons] });
            } catch (_) {}
        });
    }

    async #handleDelete(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const name = context.isMessage()
            ? context.args.slice(1).join(' ')
            : context.getInteraction().options.getString('name', true);

        if (!name) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'));
            return;
        }

        const success = bot.playlistManager!.deletePlaylist(guildId, name);

        if (success) {
            await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_DELETE_SUCCESS', { name }));
        } else {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }));
        }
    }

    async #handleImport(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const name = context.isMessage()
            ? context.args[1]
            : context.getInteraction().options.getString('name', true);
        const url = context.isMessage()
            ? context.args[2]
            : context.getInteraction().options.getString('url', true);

        if (!name || !url) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NAME_REQUIRED'));
            return;
        }

        const existingPlaylist = bot.playlistManager!.getPlaylist(guildId, name);

        const executeImport = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_M3U_DOWNLOAD_FAILED', { status: response.status }));
                    return;
                }

                const m3uContent = await response.text();
                const success = await bot.playlistManager!.importFromM3u(guildId, name, m3uContent);

                if (success) {
                    const playlist = bot.playlistManager!.getPlaylist(guildId, name);
                    await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_IMPORT_SUCCESS', { name, count: playlist?.tracks?.length || 0 }));
                } else {
                    await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_IMPORT_FAILED'));
                }
            } catch (error) {
                bot.logger.error(bot.shardId, `Error importing playlist from URL ${url}: ${error}`);
                await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAY_MUSIC', { reason: error instanceof Error ? error.message : String(error) }));
            }
        };

        if (existingPlaylist) {
            const tracksCount = existingPlaylist.tracks?.length || 0;
            const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = await import('discord.js');
            const embed = new EmbedBuilder()
                .setColor(bot.config.bot.embedsColors.warning as any || 0xFFA500)
                .setTitle(context.t('commands:MESSAGE_PLAYLIST_EXISTS_TITLE'))
                .setDescription(context.t('commands:MESSAGE_PLAYLIST_EXISTS_DESCRIPTION', { name, count: tracksCount }))
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('pl_import_confirm')
                    .setLabel(context.t('commands:LABEL_OVERWRITE'))
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('pl_import_cancel')
                    .setLabel(context.t('commands:LABEL_CANCEL'))
                    .setStyle(ButtonStyle.Secondary)
            );

            const warningMsg = await context.reply({
                embeds: [embed],
                components: [row],
                allowedMentions: { repliedUser: false }
            });

            if (!warningMsg) return;

            const collector = warningMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== context.user.id) {
                    await i.reply({ content: context.t('commands:ERROR_ONLY_COMMAND_USER_CONFIRM'), flags: 64 });
                    return;
                }

                if (i.customId === 'pl_import_confirm') {
                    await i.update({ content: context.t('commands:MESSAGE_PLAYLIST_OVERWRITING'), embeds: [], components: [] });
                    await executeImport();
                } else {
                    await i.update({ content: context.t('commands:MESSAGE_PLAYLIST_IMPORT_CANCELLED'), embeds: [], components: [] });
                }
                collector.stop();
            });

            collector.on('end', async (_, reason) => {
                if (reason === 'time') {
                    try {
                        await warningMsg.edit({ content: context.t('commands:MESSAGE_PLAYLIST_IMPORT_TIMEOUT'), embeds: [], components: [] });
                    } catch (_) {}
                }
            });
            return;
        }

        await executeImport();
    }

    async #handleRemoveTrack(bot: Bot, _client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guild!.id;
        const name = context.isMessage()
            ? context.args[1]
            : context.getInteraction().options.getString('name', true);
        const index = context.isMessage()
            ? parseInt(context.args[2], 10)
            : context.getInteraction().options.getInteger('index', true);

        if (!name || isNaN(index) || index <= 0) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_REMOVE_FAILED'));
            return;
        }

        const playlist = bot.playlistManager!.getPlaylist(guildId, name);
        if (!playlist) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name }));
            return;
        }

        const dbIndex = index - 1;
        const success = bot.playlistManager!.removeTrackFromPlaylist(playlist.id, dbIndex);

        if (success) {
            await context.replySuccess(bot, context.t('commands:MESSAGE_PLAYLIST_REMOVE_SUCCESS', { name, index }));
        } else {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_REMOVE_FAILED'));
        }
    }
}
