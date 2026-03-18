import { BaseLavaSharkEvent } from './base/BaseLavaSharkEvent.js';
import { setVoiceChannelStatus } from '../../utils/functions/setVoiceStatus.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * TrackStart event handler
 * Updates dashboard when a track starts playing
 */
export class TrackStartEvent extends BaseLavaSharkEvent<'trackStart'> {
    public getEventName(): 'trackStart' {
        return 'trackStart';
    }

    public async execute(bot: Bot, client: Client, player: Player): Promise<void> {
        const track = player.current;
        await client.dashboard.update(player, track!);

        // Set voice channel status with track info
        if (track && player.voiceChannelId) {
            const emojis = bot.config.bot.voiceStatusEmojis;
            if (emojis.length > 0) {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                const statusText = this.#formatVoiceStatus(track.author, track.title);
                await setVoiceChannelStatus(bot, client, player.voiceChannelId, `${emoji} ${statusText}`);
            }
        }

        // Save queue state on each track start
        if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
            await (client as any).queuePersistence.saveQueue(player);
        }
    }

    /**
     * Format voice channel status text with author and title.
     * Shows "Author - Title" when the author is available and meaningful,
     * otherwise just the title. Truncates to fit voice status limits.
     */
    #formatVoiceStatus(author: string | undefined, title: string): string {
        const MAX_LENGTH = 80;
        const hasAuthor = author
            && author.trim() !== ''
            && author.toLowerCase() !== 'unknown'
            && author.toLowerCase() !== title.toLowerCase();

        let statusText: string;

        if (hasAuthor) {
            const combined = `${author} - ${title}`;
            statusText = combined.length > MAX_LENGTH
                ? combined.substring(0, MAX_LENGTH - 3) + '...'
                : combined;
        }
        else {
            statusText = title.length > MAX_LENGTH
                ? title.substring(0, MAX_LENGTH - 3) + '...'
                : title;
        }

        return statusText;
    }
}
