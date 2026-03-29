import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum, LoadType } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { isUserInBlacklist } from '../utils/functions/isUserInBlacklist.js';
import { DJManager } from '../lib/DjManager.js';
import { QueueLimitManager } from '../lib/QueueLimitManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class PlayFirstCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'playfirst',
            aliases: ['pf', 'pp', 'prioritizePlay'],
            description: i18next.t('commands:CONFIG_PLAYFIRST_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_PLAYFIRST_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'playfirst',
                    description: i18next.t('commands:CONFIG_PLAYFIRST_OPTION_DESCRIPTION'),
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
            : context.getStringOption('playfirst');

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

        // Check queue limits before adding tracks
        const member = context.isMessage()
            ? context.getMessage().member
            : context.getInteraction().guild!.members.cache.get(context.user.id);

        const limitCheck = await this.#checkQueueLimits(bot, client, context, player, res, member);
        if (!limitCheck.canAdd) return;

        // Handle different load types
        await this.#handleTracks(bot, client, context, player, res, limitCheck.tracksToAdd);

        // React to indicate success (text commands only)
        if (context.isMessage()) {
            await context.react('👍');
        } else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PLAY_MUSIC_ADD'));
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
                volume: null,
                fairQueueRotation: []
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

        // Set first user as DJ in dynamic mode (skip admins and if DJ-role user is in channel)
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(player)) {
            const djMember = context.isMessage()
                ? context.getMessage().member as GuildMember | null
                : context.getInteraction().member as GuildMember | null;
            const vc = djMember?.voice.channel;
            const isAdmin = bot.config.bot.admin.includes(context.user.id);
            const hasDJRoleUser = vc?.isVoiceBased() ? DJManager.hasDJRoleInChannel(bot, vc) : false;

            if (!isAdmin && !hasDJRoleUser) {
                DJManager.addDJ(player, context.user.id);
            }
        }

        return player;
    }

    /**
     * Check queue limits before adding tracks
     * @private
     */
    async #checkQueueLimits(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: Player,
        res: any,
        member: GuildMember | null | undefined
    ): Promise<{ canAdd: boolean; tracksToAdd: number; isPartial: boolean }> {
        const userId = context.user.id;
        const guildMember = member as GuildMember | null;

        // For single track
        if (res.loadType !== LoadType.PLAYLIST) {
            const checkResult = QueueLimitManager.canAddSongs(bot, player, userId, guildMember, 1);
            
            if (!checkResult.canAdd) {
                await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_QUEUE_LIMIT_REACHED', {
                    current: checkResult.currentCount,
                    limit: checkResult.limit
                }));
                return { canAdd: false, tracksToAdd: 0, isPartial: false };
            }

            return { canAdd: true, tracksToAdd: 1, isPartial: false };
        }

        // For playlist
        const playlistSize = res.tracks.length;
        const playlistCheck = QueueLimitManager.calculatePlaylistAddition(bot, player, userId, guildMember, playlistSize);

        if (playlistCheck.limitReached) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_QUEUE_LIMIT_REACHED', {
                current: QueueLimitManager.countUserSongsInQueue(player, userId),
                limit: QueueLimitManager.getUserLimit(bot, userId, guildMember, player)
            }));
            return { canAdd: false, tracksToAdd: 0, isPartial: false };
        }

        // Partial playlist addition
        if (playlistCheck.willSkipCount > 0) {
            const currentCount = QueueLimitManager.countUserSongsInQueue(player, userId);
            const limit = QueueLimitManager.getUserLimit(bot, userId, guildMember, player);
            
            await context.replyWarning(bot, client.i18n.t('commands:MESSAGE_PLAYLIST_PARTIAL', {
                added: playlistCheck.canAddCount,
                skipped: playlistCheck.willSkipCount,
                current: currentCount + playlistCheck.canAddCount,
                limit: limit
            }));
            
            return { canAdd: true, tracksToAdd: playlistCheck.canAddCount, isPartial: true };
        }

        return { canAdd: true, tracksToAdd: playlistSize, isPartial: false };
    }

    /**
     * Handle adding and playing tracks with priority
     * @private
     */
    async #handleTracks(bot: Bot, client: Client, context: CommandContext, player: Player, res: any, tracksToAdd?: number): Promise<void> {
        const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
        const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

        if (res.loadType === LoadType.PLAYLIST) {
            // Add only the allowed number of tracks from playlist
            const tracks = tracksToAdd !== undefined ? res.tracks.slice(0, tracksToAdd) : res.tracks;
            player.addTracks(tracks, requester as any);

            if (!player.playing) {
                player.filters.setVolume(curVolume);
                await player.play()
                    .catch(async (error) => {
                        bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                        await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }));
                        return player.destroy();
                    });
            }
        }
        else {
            const track = res.tracks[0];
            await player.prioritizePlay(track, requester as any)
                .catch(async (error) => {
                    bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                    await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }));
                    return player.destroy();
                });
        }
    }
}
