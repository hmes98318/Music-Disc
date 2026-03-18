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
     * Strip common YouTube title noise such as "[OFFICIAL VIDEO]",
     * "(Official Audio)", "(Lyrics)", quality tags like "[HD]", and
     * trailing separator fragments left after removal.
     */
    #cleanTitle(text: string): string {
        // Remove bracketed/parenthesized tags: official, music, lyric, hd, hq, 4k, video, audio, lyrics
        const tagPattern = /[\[\(]\s*(?:official\s*)?(?:music\s*)?(?:hd\s*|hq\s*|4k\s*)?(?:lyric\s*)?(?:video|audio|lyrics?)(?:\s*(?:hd|hq|4k))?\s*[\]\)]/gi;
        let cleaned = text.replace(tagPattern, '');

        // Remove standalone quality tags: [HD], [HQ], [4K], (HD), (HQ), (4K)
        cleaned = cleaned.replace(/[\[\(]\s*(?:hd|hq|4k)\s*[\]\)]/gi, '');

        // Remove trailing "| Official Video", "- Official Audio", etc.
        cleaned = cleaned.replace(/\s*[|\-]\s*official\s*(?:music\s*)?(?:hd\s*)?(?:lyric\s*)?(?:video|audio|lyrics?)\s*$/i, '');

        // Trim leftover trailing separators and whitespace
        cleaned = cleaned.replace(/[\s\-|]+$/, '').trim();

        return cleaned || text.trim();
    }

    /**
     * Format voice channel status text with author and title.
     * Shows "Author - Title" when the author is available and meaningful,
     * otherwise just the title. Truncates to fit voice status limits.
     */
    #formatVoiceStatus(author: string | undefined, title: string): string {
        const MAX_LENGTH = 80;

        const cleanedTitle = this.#cleanTitle(title);
        const cleanedAuthor = author ? this.#cleanTitle(author) : author;

        const hasAuthor = cleanedAuthor
            && cleanedAuthor.trim() !== ''
            && cleanedAuthor.toLowerCase() !== 'unknown'
            && cleanedAuthor.toLowerCase() !== cleanedTitle.toLowerCase();

        let statusText: string;

        if (hasAuthor) {
            const combined = `${cleanedAuthor} - ${cleanedTitle}`;
            statusText = combined.length > MAX_LENGTH
                ? combined.substring(0, MAX_LENGTH - 3) + '...'
                : combined;
        }
        else {
            statusText = cleanedTitle.length > MAX_LENGTH
                ? cleanedTitle.substring(0, MAX_LENGTH - 3) + '...'
                : cleanedTitle;
        }

        return statusText;
    }
}
