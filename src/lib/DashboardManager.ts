import { ChatInputCommandInteraction, Message } from 'discord.js';

import { embeds } from '../embeds/index.js';
import { DJManager } from './DjManager.js';
import { DJModeEnum } from '../@types/index.js';
import { ButtonsBuilder } from './builders/ButtonsBuilder.js';

import type { Player, Track } from 'lavashark';
import type { Bot } from '../@types/index.js';
import type { Client } from 'discord.js';


/**
 * Dashboard management system for music playback control
 * Handles initialization, updates, and cleanup of dashboard messages
 */
export class DashboardManager {
    #bot: Bot;
    #client: Client;
    #updatePromise: Promise<void> = Promise.resolve();

    constructor(bot: Bot, client: Client) {
        this.#bot = bot;
        this.#client = client;
    }

    /**
     * Initialize dashboard in a channel
     */
    public async initialize(
        target: ChatInputCommandInteraction | Message | any,
        player: Player
    ): Promise<void> {
        let channel;

        if (target instanceof Message) {
            channel = target.channel;
        }
        else if (target instanceof ChatInputCommandInteraction) {
            channel = target.channel;
        }
        else if (target && typeof target.send === 'function') {
            channel = target;
        }
        else {
            throw new TypeError('Invalid Interaction, Message, or Channel type');
        }

        if (player.dashboardMsg) {
            try {
                await player.dashboardMsg.delete();
            } catch (_) {}
            player.dashboardMsg = null;
        }

        const lng = this.#bot.guildLanguageManager?.get(player.guildId);

        player.dashboardMsg = await (channel as any).send({
            embeds: [embeds.connected(this.#bot, lng)],
            components: []
        });
    }

    /**
     * Update dashboard with current track and player state (smart edit or re-send to bottom)
     */
    public async update(player: Player, track: Track): Promise<void> {
        this.#updatePromise = this.#updatePromise.then(() => this.#performUpdate(player, track)).catch(() => {});
        return this.#updatePromise;
    }

    async #performUpdate(player: Player, track: Track): Promise<void> {
        const lng = this.#bot.guildLanguageManager?.get(player.guildId);
        let subtitle = await this.#buildSubtitle(player, track, lng);
        const buttons = ButtonsBuilder.createDashboardButtons(player, lng);

        const safeTitle = track.title.length > 256
            ? track.title.substring(0, 253) + '...'
            : track.title;

        if (subtitle.length > 1024) {
            subtitle = subtitle.substring(0, 1021) + '...';
        }

        const channel = player.dashboardMsg?.channel
            ?? (player.textChannelId ? this.#client.channels.cache.get(player.textChannelId) : null);

        if (!channel || typeof (channel as any).send !== 'function') {
            this.#bot.logger.error(this.#bot.shardId, 'Dashboard update called but channel is missing or invalid');
            return;
        }

        const embedPayload = {
            embeds: [embeds.dashboard(
                this.#bot,
                this.#bot.i18n.t('embeds:DASHBOARD_TITLE', { lng }),
                safeTitle,
                subtitle,
                track.uri,
                track.thumbnail!
            )],
            components: [buttons]
        };

        if (player.dashboardMsg) {
            try {
                const lastMsgId = (channel as any).lastMessageId;
                if (!lastMsgId || lastMsgId === player.dashboardMsg.id) {
                    await player.dashboardMsg.edit(embedPayload);
                    return;
                }
            } catch (_) {}

            try {
                await player.dashboardMsg.delete();
            } catch (_) {}
            player.dashboardMsg = null;
        }

        try {
            player.dashboardMsg = await (channel as any).send(embedPayload);
        } catch (error) {
            this.#bot.logger.error(this.#bot.shardId, 'Dashboard update error: ' + error);
        }
    }

    /**
     * Destroy dashboard and show disconnect message
     */
    public async destroy(player: Player): Promise<void> {
        if (!player.dashboardMsg) {
            return;
        }

        const lng = this.#bot.guildLanguageManager?.get(player.guildId);

        try {
            await player.dashboardMsg.edit({
                embeds: [embeds.disconnect(this.#bot, lng)],
                components: []
            });
        } catch (error) {
            this.#bot.logger.error( this.#bot.shardId, 'Dashboard destroy error: ' + error);
        }
        finally {
            player.dashboardMsg = null;
        }
    }

    /**
     * Build subtitle with track info, volume, repeat mode, and DJ info
     */
    async #buildSubtitle(player: Player, track: Track, lng?: string): Promise<string> {
        const repeatModeLabel = this.#getRepeatModeLabel(player.repeatMode, lng);

        let subtitle = this.#bot.i18n.t('embeds:DASHBOARD_SUBTITLE', {
            author: track.author,
            duration: track.duration.label,
            volume: player.volume,
            repeatMode: repeatModeLabel,
            lng
        });

        // Add requester info
        const requesterId = track.requester?.id;
        if (requesterId) {
            subtitle += this.#bot.i18n.t('embeds:DASHBOARD_REQUESTER_INFO', { requesterId, lng });
        }

        // Add Dynamic DJ info (only if DYNAMIC mode AND a DJ is assigned)
        if (this.#bot.config.bot.djMode === DJModeEnum.DYNAMIC && player.djUsers && player.djUsers.size > 0) {
            try {
                const guild = this.#client.guilds.cache.get(player.guildId);
                const djDisplay = await DJManager.getDJDisplayString(this.#bot, this.#client, guild, player);
                subtitle += this.#bot.i18n.t('embeds:DASHBOARD_DJ_INFO', { djDisplay, lng });
            } catch (_) {
                // Ignore errors in DJ display
            }
        }

        return subtitle;
    }

    /**
     * Get repeat mode label for display
     */
    #getRepeatModeLabel(repeatMode: number, lng?: string): string {
        const methods = [
            this.#bot.i18n.t('commands:REPEAT_MODE_OFF', { lng }),
            this.#bot.i18n.t('commands:REPEAT_MODE_SINGLE', { lng }),
            this.#bot.i18n.t('commands:REPEAT_MODE_ALL', { lng })
        ];
        return methods[repeatMode] || methods[0];
    }
}
