import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client, GuildMember } from 'discord.js';
import type { Track } from 'lavashark';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


/**
 * PlayLast command - Replay the current or last played song
 */
export class PlayLastCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'playlast',
            aliases: [],
            description: i18next.t('commands:CONFIG_PLAYLAST_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_PLAYLAST_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const guildId = context.guildId;
        if (!guildId) return;

        // Check if user is in a voice channel
        const member = context.isMessage()
            ? context.getMessage().member as GuildMember | null
            : context.getInteraction().member as GuildMember | null;

        const voiceChannel = member?.voice.channel;
        if (!voiceChannel) {
            await context.replyEphemeralError(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'));
            return;
        }

        const player = client.lavashark.getPlayer(guildId);

        // If player exists and queue is NOT empty: deny
        if (player && player.queue.tracks.length > 0) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAYLAST_QUEUE_NOT_EMPTY'));
            return;
        }

        // If player exists and is playing (queue IS empty): re-add current track
        if (player && player.playing && player.current) {
            const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
            player.addTracks(player.current, requester as any);
            await this.#replyWithTrackEmbed(bot, client, context, player.current);
            return;
        }

        // No player or not playing: check for last played track
        const lastTrack = client.lastPlayedTracks.get(guildId);
        if (!lastTrack) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAYLAST_NO_LAST_TRACK'));
            return;
        }

        // Create a player and play the last track
        const newPlayer = client.lavashark.createPlayer({
            guildId: guildId,
            voiceChannelId: voiceChannel.id,
            textChannelId: context.channel!.id,
            selfDeaf: true
        });

        if (!newPlayer.setting) {
            newPlayer.setting = {
                queuePage: null,
                volume: null,
                fairQueueRotation: []
            };
        }

        const metadata = context.isMessage() ? context.getMessage() : context.getInteraction();

        try {
            await newPlayer.connect();
            newPlayer.metadata = metadata;
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
            await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_JOIN_CHANNEL'));
            return;
        }

        try {
            if (!newPlayer.dashboardMsg) {
                await client.dashboard.initialize(metadata, newPlayer);
            }
        } catch (error) {
            await client.dashboard.destroy(newPlayer);
        }

        // Set first user as DJ in dynamic mode
        if (bot.config.bot.djMode === DJModeEnum.DYNAMIC && !DJManager.hasDJSet(newPlayer)) {
            DJManager.addDJ(newPlayer, context.user.id);
        }

        const requester = context.isMessage() ? context.getMessage().author : context.getInteraction().user;
        const curVolume = newPlayer.setting.volume ?? bot.config.bot.volume.default;

        newPlayer.addTracks(lastTrack, requester as any);
        newPlayer.filters.setVolume(curVolume);

        await newPlayer.play()
            .catch(async (error) => {
                bot.logger.emit('error', bot.shardId, 'Error playing track: ' + error);
                await context.replyError(bot, client.i18n.t('commands:ERROR_PLAY_MUSIC', { reason: JSON.stringify(error) }));
                return newPlayer.destroy();
            });

        await this.#replyWithTrackEmbed(bot, client, context, lastTrack);
    }

    /**
     * Reply with a rich embed showing track info
     * @private
     */
    async #replyWithTrackEmbed(bot: Bot, client: Client, context: CommandContext, track: Track): Promise<void> {
        const subtitle = client.i18n.t('events:MESSAGE_NOW_PLAYING_SUBTITLE', {
            author: track.author,
            label: track.duration.label
        });

        await context.reply({
            embeds: [embeds.addTrack(bot, track.title, subtitle, track.uri, track.thumbnail!)]
        });
    }
}
