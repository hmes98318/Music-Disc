import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * Set idle voice channel status (shown when bot is connected but not playing)
 * Does nothing if voiceStatusIdleText is empty
 */
export async function setIdleVoiceStatus(bot: Bot, client: Client, voiceChannelId: string): Promise<void> {
    const idleText = bot.config.bot.voiceStatusIdleText;
    if (!idleText) return;
    await setVoiceChannelStatus(bot, client, voiceChannelId, idleText);
}


/**
 * Set or clear voice channel status
 * Uses discord.js VoiceChannel.setStatus() if available, falls back to REST API
 */
export async function setVoiceChannelStatus(
    bot: Bot,
    client: Client,
    voiceChannelId: string,
    status: string | null
): Promise<void> {
    try {
        const channel = client.channels.cache.get(voiceChannelId);

        if (channel?.isVoiceBased() && 'setStatus' in channel) {
            await (channel as any).setStatus(status ?? '');
        } else {
            // Fallback to REST API
            await (client.rest as any).put(`/channels/${voiceChannelId}/voice-status`, {
                body: { status: status ?? '' }
            });
        }
    } catch (error) {
        bot.logger.emit('log', bot.shardId, `[VoiceStatus] Failed to set status: ${error}`);
    }
}
