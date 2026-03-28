import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { setIdleVoiceStatus } from '../utils/functions/setVoiceStatus.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class JoinCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'join',
            aliases: ['add', 'summon'],
            description: i18next.t('commands:CONFIG_JOIN_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_JOIN_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        // Get voice channel
        const voiceChannelId = context.isMessage()
            ? context.getMessage().member!.voice.channelId
            : context.getInteraction().guild!.members.cache.get(context.user.id)?.voice.channelId;

        // Create player
        const player = client.lavashark.createPlayer({
            guildId: String(context.guild?.id),
            voiceChannelId: String(voiceChannelId),
            textChannelId: String(context.channel!.id),
            selfDeaf: true
        });

        if (!player.setting) {
            player.setting = {
                queuePage: null,
                volume: null,
                fairQueueRotation: []
            };
        }

        const curVolume = player.setting.volume ?? bot.config.bot.volume.default;

        try {
            // Connect to voice channel
            await player.connect();

            player.metadata = context.isMessage() ? context.getMessage() : context.getInteraction();
            player.filters.setVolume(curVolume);

            // Set idle voice status
            if (player.voiceChannelId) {
                await setIdleVoiceStatus(bot, client, player.voiceChannelId);
            }
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Error joining channel: ' + error);
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_PLAY_JOIN_CHANNEL'));
            return;
        }

        try {
            // Initialize dashboard
            if (!player.dashboardMsg) {
                if (context.isMessage()) {
                    await client.dashboard.initialize(context.getMessage(), player);
                }
                else {
                    await client.dashboard.initialize(context.getInteraction(), player);
                }
            }
        } catch (error) {
            await client.dashboard.destroy(player);
        }

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_JOIN_SUCCESS'));
        }
    }
}
