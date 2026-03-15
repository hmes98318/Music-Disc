import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, DJModeEnum } from '../@types/index.js';
import { DJManager } from '../lib/DjManager.js';

import type { Client, GuildMember } from 'discord.js';
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
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PLAYLAST_SUCCESS'));
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
                volume: null
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

        await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_PLAYLAST_SUCCESS'));
    }
}
