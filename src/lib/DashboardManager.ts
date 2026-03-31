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

    constructor(bot: Bot, client: Client) {
        this.#bot = bot;
        this.#client = client;
    }

    /**
     * Initialize dashboard in a channel
     */
    public async initialize(interactionOrMessage: ChatInputCommandInteraction | Message, player: Player): Promise<void> {
        let channel;

        if (interactionOrMessage instanceof Message) {
            channel = (interactionOrMessage as Message).channel;
        }
        else if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            channel = (interactionOrMessage as ChatInputCommandInteraction).channel;
        }
        else {
            throw new TypeError('Invalid Interaction or Message type');
        }

        player.dashboardMsg = await (channel as any /* discord.js type error ? (v14.16.2) */).send({
            embeds: [embeds.connected(this.#bot)],
            components: []
        });
    }

    /**
     * Update dashboard with current track and player state
     */
    public async update(player: Player, track: Track): Promise<void> {
        if (!player.dashboardMsg) {
            this.#bot.logger.emit('error', this.#bot.shardId, 'Dashboard update called but dashboard is null');
            return;
        }

        const subtitle = await this.#buildSubtitle(player, track);
        const buttons = ButtonsBuilder.createDashboardButtons(player);

        try {
            await player.dashboardMsg.edit({
                embeds: [embeds.dashboard(
                    this.#bot,
                    'Dashboard',
                    track.title,
                    subtitle,
                    track.uri,
                    track.thumbnail!
                )],
                components: [buttons]
            });
        } catch (error) {
            this.#bot.logger.emit('error', this.#bot.shardId, 'Dashboard update error: ' + error);
        }
    }

    /**
     * Destroy dashboard and show disconnect message
     */
    public async destroy(player: Player): Promise<void> {
        if (!player.dashboardMsg) {
            return;
        }

        try {
            await player.dashboardMsg.edit({
                embeds: [embeds.disconnect(this.#bot)],
                components: []
            });
        } catch (error) {
            this.#bot.logger.emit('error', this.#bot.shardId, 'Dashboard destroy error: ' + error);
        }
        finally {
            player.dashboardMsg = null;
        }
    }

    /**
     * Build subtitle with track info, volume, repeat mode, and DJ info
     */
    async #buildSubtitle(player: Player, track: Track): Promise<string> {
        const repeatModeLabel = this.#getRepeatModeLabel(player.repeatMode);

        let subtitle = this.#bot.i18n.t('embeds:DASHBOARD_SUBTITLE', {
            author: track.author,
            duration: track.duration.label,
            volume: player.volume,
            repeatMode: repeatModeLabel
        });

        // Add requester info
        const requesterId = track.requester?.id;
        if (requesterId) {
            subtitle += this.#bot.i18n.t('embeds:DASHBOARD_REQUESTER_INFO', { requesterId });
        }

        // Add Dynamic DJ info (only if DYNAMIC mode AND a DJ is assigned)
        if (this.#bot.config.bot.djMode === DJModeEnum.DYNAMIC && player.djUsers && player.djUsers.size > 0) {
            try {
                const guild = this.#client.guilds.cache.get(player.guildId);
                const djDisplay = await DJManager.getDJDisplayString(this.#bot, this.#client, guild, player);
                subtitle += this.#bot.i18n.t('embeds:DASHBOARD_DJ_INFO', { djDisplay });
            } catch (_) {
                // Ignore errors in DJ display
            }
        }

        return subtitle;
    }

    /**
     * Get repeat mode label for display
     */
    #getRepeatModeLabel(repeatMode: number): string {
        const methods = [
            this.#bot.i18n.t('commands:REPEAT_MODE_OFF'),
            this.#bot.i18n.t('commands:REPEAT_MODE_SINGLE'),
            this.#bot.i18n.t('commands:REPEAT_MODE_ALL')
        ];
        return methods[repeatMode] || methods[0];
    }
}
