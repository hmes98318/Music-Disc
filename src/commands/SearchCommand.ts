import {
    ActionRowBuilder,
    ButtonInteraction,
    Collection,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum, LoadType, SelectButtonId } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { isUserInBlacklist } from '../utils/functions/isUserInBlacklist.js';
import { DJManager } from '../lib/DjManager.js';
import { QueueLimitManager } from '../lib/QueueLimitManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class SearchCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'search',
            aliases: ['find'],
            description: i18next.t('commands:CONFIG_SEARCH_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_SEARCH_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'search',
                    description: i18next.t('commands:CONFIG_SEARCH_OPTION_DESCRIPTION'),
                    type: 3,
                    required: true
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        // Get search query
        const str = context.isMessage()
            ? context.args.join(' ')
            : context.getStringOption('search');

        if (!str) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_PLAY_ARGS_ERROR'));
            return;
        }

        // Search for tracks
        let res;
        try {
            res = await client.lavashark.search(str);
        } catch (error) {
            console.error(error);
            bot.logger.emit('error', bot.shardId, `Search Error: ${error}`);
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', {
                reason: error instanceof Error ? error.message : String(error)
            }));
            return;
        }

        // Handle search results
        if (res.loadType === LoadType.ERROR) {
            bot.logger.emit('error', bot.shardId, `Search Error: ${JSON.stringify(res)}`);
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAY_SEARCH', {
                reason: (res as any).data?.message
            }));
            return;
        }
        else if (res.loadType === LoadType.EMPTY) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_PLAY_SEARCH_NO_MATCH'));
            return;
        }

        // Validate user is not in blacklist
        const voiceChannel = context.isMessage()
            ? context.getMessage().member?.voice.channel
            : context.getInteraction().guild!.members.cache.get(context.user.id)?.voice.channel;

        const validBlackist = isUserInBlacklist(voiceChannel, bot.config.blacklist, bot.blacklistManager);
        if (validBlackist.length > 0) {
            await context.reply({
                embeds: [embeds.blacklist(bot, validBlackist)]
            });
            return;
        }

        // Create or get player
        const player = await this.#createPlayer(bot, client, context);
        if (!player) return;

        // Get member for queue limit checks
        const member = context.isMessage()
            ? context.getMessage().member
            : context.getInteraction().guild!.members.cache.get(context.user.id);

        // React to indicate success (text commands only)
        if (context.isMessage()) {
            await context.react('👍');
        }

        // Handle different load types
        if (res.loadType === LoadType.PLAYLIST) {
            await this.#handlePlaylist(bot, client, context, player, res, member);
        }
        else if (res.tracks.length === 1) {
            await this.#handleSingleTrack(bot, client, context, player, res, member);
        }
        else {
            await this.#handleMusicSelection(bot, client, context, player, res, member);
        }
    }

    /**
     * Create and initialize player
     * @private
     */
    async #createPlayer(bot: Bot, client: Client, context: CommandContext): Promise<Player | null> {
        const voiceChannelId = context.isMessage()
            ? String(context.getMessage().member?.voice.channelId)
            : String(context.getInteraction().guild!.members.cache.get(context.user.id)?.voice.channelId);

        const player = client.lavashark.createPlayer({
            guildId: String(context.guild?.id),
            voiceChannelId: voiceChannelId,
            textChannelId: context.channel!.id,
            selfDeaf: true
        });

        if (!player.setting) {
            player.setting = {
                queuePage: null,
                volume: null
            };
        }

        const metadata = context.isMessage() ? context.getMessage() : context.getInteraction();

        try {
            await player.connect();
            player.metadata = metadata;
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAY_JOIN_CHANNEL'));
            return null;
        }

        try {
            if (!player.dashboardMsg) {
                await client.dashboard.initialize(metadata, player);
            }
        } catch (error) {
            await client.dashboard.destroy(player);
        }

        // Set first user as DJ in dynamic mode
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(player)) {
            DJManager.addDJ(player, context.user.id);
        }

        return player;
    }

    /**
     * Handle playlist load type
     * @private
     */
    async #handlePlaylist(bot: Bot, client: Client, context: CommandContext, player: Player, res: any, member: GuildMember | null | undefined): Promise<void> {
        const userId = context.user.id;
        const guildMember = member as GuildMember | null;
        const playlistSize = res.tracks.length;
        
        // Check queue limits for playlist
        const playlistCheck = QueueLimitManager.calculatePlaylistAddition(bot, player, userId, guildMember, playlistSize);

        if (playlistCheck.limitReached) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_QUEUE_LIMIT_REACHED', {
                current: QueueLimitManager.countUserSongsInQueue(player, userId),
                limit: QueueLimitManager.getUserLimit(bot, userId, guildMember, player)
            }));
            return;
        }

        const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
        const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

        // Add only allowed tracks
        const tracksToAdd = playlistCheck.canAddCount < playlistSize ? res.tracks.slice(0, playlistCheck.canAddCount) : res.tracks;
        player.addTracks(tracksToAdd, requester as any);

        if (!player.playing) {
            player.filters.setVolume(curVolume);
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }));
                    return player.destroy();
                });
        }

        // Show appropriate message
        if (playlistCheck.willSkipCount > 0) {
            const currentCount = QueueLimitManager.countUserSongsInQueue(player, userId);
            const limit = QueueLimitManager.getUserLimit(bot, userId, guildMember, player);
            
            await context.replyWarning(bot, client.i18n.t('commands:MESSAGE_PLAYLIST_PARTIAL', {
                added: playlistCheck.canAddCount,
                skipped: playlistCheck.willSkipCount,
                current: currentCount,
                limit: limit
            }));
        } else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PLAY_MUSIC_ADD'));
        }
    }

    /**
     * Handle single track
     * @private
     */
    async #handleSingleTrack(bot: Bot, client: Client, context: CommandContext, player: Player, res: any, member: GuildMember | null | undefined): Promise<void> {
        const userId = context.user.id;
        const guildMember = member as GuildMember | null;
        
        // Check queue limits for single track
        const checkResult = QueueLimitManager.canAddSongs(bot, player, userId, guildMember, 1);
        
        if (!checkResult.canAdd) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_QUEUE_LIMIT_REACHED', {
                current: checkResult.currentCount,
                limit: checkResult.limit
            }));
            return;
        }

        const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
        const curVolume = player.setting.volume ?? bot.config.bot.volume.default;
        const track = res.tracks[0];

        player.addTracks(track, requester as any);

        if (!player.playing) {
            player.filters.setVolume(curVolume);
            await player.play()
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }));
                    return player.destroy();
                });
        }

        await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PLAY_MUSIC_ADD'));
    }

    /**
     * Handle interactive music selection
     * @private
     */
    async #handleMusicSelection(bot: Bot, client: Client, context: CommandContext, player: Player, res: any, member: GuildMember | null | undefined): Promise<void> {
        const userId = context.user.id;
        const guildMember = member as GuildMember | null;

        const select = new StringSelectMenuBuilder()
            .setCustomId(SelectButtonId.Music)
            .setPlaceholder(client.i18n.t('commands:MESSAGE_PLAY_SELECT_TITLE'))
            .setOptions(res.tracks.map((x: any) => {
                return {
                    label: x.title.length >= 25 ? x.title.substring(0, 22) + '...' : x.title,
                    description: client.i18n.t('commands:MESSAGE_PLAY_SELECT_DURATION', { label: x.duration.label }),
                    value: x.uri
                };
            }));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await context.reply({ components: [row.toJSON()] });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === context.user.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId != SelectButtonId.Music) return;

            // Check queue limits before adding selected track
            const checkResult = QueueLimitManager.canAddSongs(bot, player, userId, guildMember, 1);
            
            if (!checkResult.canAdd) {
                await i.deferUpdate();
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_QUEUE_LIMIT_REACHED', {
                        current: checkResult.currentCount,
                        limit: checkResult.limit
                    }))],
                    components: []
                });
                return;
            }

            const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
            const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

            player.addTracks(res.tracks.find((x: any) => x.uri == i.values[0])!, requester as any);

            if (!player.playing) {
                player.filters.setVolume(curVolume);
                await player.play()
                    .catch(async (error) => {
                        bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);

                        await context.reply({
                            embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }))],
                            components: [],
                            allowedMentions: { repliedUser: false }
                        });

                        return player.destroy();
                    });
            }

            await i.deferUpdate();

            await msg.edit({
                embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_PLAY_MUSIC_ADD'))],
                components: []
            });
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == 'time' && collected.size == 0) {
                if (!player.playing) {
                    player.destroy();
                }

                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: []
                });
            }
        });
    }
}
