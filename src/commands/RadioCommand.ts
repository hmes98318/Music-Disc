import i18next from 'i18next';
import { ApplicationCommandOptionType } from 'discord.js';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';

export class RadioCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'radio',
            aliases: [],
            description: i18next.t('commands:CONFIG_RADIO_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_RADIO_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'playlist',
                    description: i18next.t('commands:CONFIG_RADIO_OPTION_PLAYLIST'),
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'channel',
                    description: i18next.t('commands:CONFIG_RADIO_OPTION_CHANNEL'),
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        if (!bot.playlistManager) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_INITIALIZED'));
            return;
        }

        const guildId = context.guild!.id;
        let playlistName: string;
        let channelQuery: string;

        if (context.isMessage()) {
            const args = context.args;
            if (args.length < 2) {
                await context.replyEphemeralError(bot, context.t('commands:ERROR_RADIO_USAGE_EXAMPLE', { prefix: bot.config.bot.prefix }));
                return;
            }
            playlistName = args[0];
            channelQuery = args.slice(1).join(' ');
        } else {
            playlistName = context.getInteraction().options.getString('playlist', true);
            channelQuery = context.getInteraction().options.getString('channel', true);
        }

        if (!playlistName || !channelQuery) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_RADIO_REQUIRED_ARGS'));
            return;
        }

        const playlist = bot.playlistManager!.getPlaylist(guildId, playlistName);
        if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
            await context.replyEphemeralError(bot, context.t('commands:ERROR_PLAYLIST_NOT_FOUND', { name: playlistName }));
            return;
        }

const DEFAULT_MAX_SAMPLES_COUNT = 10;

        const normalize = (str: string) => str.toLowerCase().replace(/['’\`\s\-_]/g, '');
        const queryNormalized = normalize(channelQuery);

        const exactMatch = playlist.tracks.find(t => normalize(t.title) === queryNormalized);
        const matchedTracks = exactMatch
            ? [exactMatch]
            : playlist.tracks.filter(t => normalize(t.title).includes(queryNormalized));

        if (matchedTracks.length === 0) {
            const samples = playlist.tracks.slice(0, DEFAULT_MAX_SAMPLES_COUNT).map(t => `\`${t.title}\``).join(', ');
            await context.replyEphemeralError(
                bot,
                context.t('commands:ERROR_RADIO_NO_MATCH_PLAYLIST', { playlistName, channelQuery, samples })
            );
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

        const targetTrack = matchedTracks[0];

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

        await context.replySuccess(bot, context.t('commands:MESSAGE_RADIO_SEARCHING', { playlist: playlistName, title: targetTrack.title }));

        try {
            let searchResult = null;
            if (targetTrack.url) {
                try {
                    searchResult = await client.lavashark.search(targetTrack.url);
                } catch (_) {}
            }

            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                try {
                    searchResult = await client.lavashark.search(`ytsearch:${targetTrack.title}`);
                } catch (_) {}
            }

            if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
                const track = searchResult.tracks[0];
                (track as any).requester = requester;

                const isAlreadyPlaying = player.playing;

                // Radio request replaces existing queue/radio & plays as playfirst
                player.queue.tracks = player.queue.tracks.filter((t: any) => !t.isRadio && t.title !== targetTrack.title);
                player.queue.tracks.unshift(track);
                (track as any).isRadio = true;

                if (isAlreadyPlaying) {
                    await player.skip();
                } else {
                    player.filters.setVolume(curVolume);
                    await player.play().catch(async (error) => {
                        bot.logger.error(bot.shardId, 'Error playing track: ' + error);
                        return player!.destroy();
                    });
                }

                if (bot.config.queuePersistence.enabled && client.queuePersistence) {
                    await client.queuePersistence.saveQueue(player);
                }

                if (context.channel && 'send' in context.channel) {
                    await (context.channel as any).send({
                        content: context.t('commands:MESSAGE_RADIO_PLAYING', { playlist: playlistName, title: targetTrack.title })
                    });
                }
            } else {
                await context.replyEphemeralError(bot, context.t('commands:ERROR_RADIO_STREAM_FAILED', { title: targetTrack.title }));
            }
        } catch (err) {
            bot.logger.error(bot.shardId, `Error loading radio track ${targetTrack.title}: ${err}`);
            await context.replyEphemeralError(bot, context.t('commands:ERROR_RADIO_LOAD_FAILED', { error: err instanceof Error ? err.message : String(err) }));
        }
    }
}
