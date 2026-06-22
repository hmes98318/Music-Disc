import { GatewayIntentBits } from 'discord.js';
import { cst } from '../../../utils/constants.js';
import { sysusage } from '../../../utils/functions/sysusage.js';
import { uptime } from '../../../utils/functions/uptime.js';
import { ok, problem } from '../http.js';
import { BaseRouter } from './BaseRouter.js';

import type { Request, Response } from 'express';


// String union of all valid Gateway Intent names, derived from the discord.js enum.
type IntentName = keyof typeof GatewayIntentBits;

// Privileged intents as defined by the Discord API.
const PRIVILEGED_INTENTS = new Set<string>(
    ['GuildPresences', 'GuildMembers', 'MessageContent'] satisfies IntentName[],
);

// The privileged intents that Music Disc may use.
// Any enabled privileged intent outside this set triggers a warning.
const BOT_PRIVILEGED_INTENTS = new Set<string>(
    ['MessageContent'] satisfies IntentName[],
);

/**
 * Handles bot information routes:
 *   GET /api/bot         - System information and statistics
 *   GET /api/bot/runtime - Real-time system status (CPU, RAM, ping, etc.)
 *   GET /api/bot/intents - Gateway intent configuration and requirement check
 */
export class BotInfoRouter extends BaseRouter {
    /** Prevents concurrent broadcastEval calls during a cache refresh. */
    #pendingInfoFetch: Promise<void> | null = null;

    constructor(...args: ConstructorParameters<typeof BaseRouter>) {
        super(...args);
        this.registerRoutes();
    }

    protected registerRoutes(): void {
        this.router.get('/', this.#summary.bind(this));
        this.router.get('/runtime', this.#runtime.bind(this));
        this.router.get('/intents', this.#intents.bind(this));
    }

    /**
     * GET /api/bot
     * Returns static system info and current guild count statistics.
     */
    async #summary(_req: Request, res: Response): Promise<Response> {
        const needsRefresh =
            !this.bot.stats.lastRefresh ||
            (Date.now() - this.bot.stats.lastRefresh) > cst.cacheExpiration;

        if (needsRefresh) {
            // Coalesce concurrent requests onto the same pending fetch
            this.#pendingInfoFetch ??= this.#fetchShardInfo().finally(() => {
                this.#pendingInfoFetch = null;
            });
            await this.#pendingInfoFetch;
        }

        const totalServerCount = this.bot.stats.guildsCount.reduce((acc, count) => acc + count, 0);

        return ok(res, {
            name: this.bot.config.bot.name,
            startupTime: new Date(this.bot.sysInfo.startupTime).toISOString(),
            versions: {
                bot: this.bot.sysInfo.bot_version,
                node: this.bot.sysInfo.node_version,
                discordJs: this.bot.sysInfo.dc_version,
                lavashark: this.bot.sysInfo.shark_version,
            },
            environment: {
                os: this.bot.sysInfo.os_version,
                cpu: this.bot.sysInfo.cpu,
            },
            guilds: {
                total: totalServerCount,
                perShard: this.bot.stats.guildsCount,
            },
            i18n: {
                defaultLocale: this.bot.config.bot.i18n.defaultLocale,
            },
        });
    }

    /**
     * Fetches per-shard guild counts and updates the shared stats object.
     * On failure, advances `lastRefresh` by (cacheExpiration − BACKOFF_MS) so the
     * next retry is delayed by BACKOFF_MS rather than hammering Discord immediately.
     */
    async #fetchShardInfo(): Promise<void> {
        /** Retry backoff in ms: on failure, delay next attempt by 30 seconds. */
        const BACKOFF_MS = 30_000;

        try {
            const results = await this.shardManager.broadcastEval(async (client) => {
                await client.guilds.fetch();
                return client.guilds.cache.size;
            });

            this.bot.stats.guildsCount = results as number[];
            this.bot.stats.lastRefresh = Date.now();
        }
        catch (error) {
            this.bot.logger.api( `Failed to get shard info: ${error}`);
            // Advance lastRefresh so the next retry is delayed by BACKOFF_MS
            this.bot.stats.lastRefresh = Date.now() - cst.cacheExpiration + BACKOFF_MS;
        }
    }

    /**
     * GET /api/bot/runtime
     * Returns real-time system status including CPU, RAM, heap, ping, and playing count.
     */
    async #runtime(_req: Request, res: Response): Promise<Response> {
        const [pingResult, playerCountResult] = await Promise.allSettled([
            this.shardManager.fetchClientValues('ws.ping').catch(() => [-1]),
            this.shardManager.fetchClientValues('lavashark.players.size').catch(() => [-1]),
        ]);

        const totalPlayerCount =
            playerCountResult.status === 'fulfilled'
                ? (playerCountResult.value as number[]).reduce((total, count) => total + count, 0)
                : 0;

        const pingValues = pingResult.status === 'fulfilled' ? (pingResult.value as number[]) : [-1];
        const playerValues = playerCountResult.status === 'fulfilled' ? (playerCountResult.value as number[]) : [];

        return ok(res, {
            load: await sysusage.cpu(),
            memory: sysusage.ram(),
            heap: sysusage.heap(),
            uptime: uptime(this.bot.sysInfo.startupTime),
            ping: {
                gateway: pingValues,
            },
            players: {
                total: totalPlayerCount,
                perShard: playerValues,
            },
        });
    }

    /**
     * GET /api/bot/intents
     * Returns gateway intent configuration: configured intents vs. Music Disc requirements.
     * Warns if any privileged intents are enabled but not required.
     */
    async #intents(_req: Request, res: Response): Promise<Response> {
        // Intents are configured identically on every shard — query just the first.
        let configuredIntents: string[];
        try {
            const results = await this.shardManager.broadcastEval((client) => {
                return client.options.intents.toArray() as string[];
            });
            configuredIntents = (results[0] ?? []) as string[];
        }
        catch (error) {
            this.bot.logger.api(`Failed to fetch intents from shard: ${error}`);
            return problem(res, {
                status: 503,
                title: 'Intents unavailable',
                detail: 'Failed to retrieve intent configuration from the bot.',
                code: 'INTENTS_UNAVAILABLE',
            });
        }

        const configuredSet = new Set(configuredIntents);

        // Define what Music Disc requires based on current config
        const requiredIntents = new Set<string>(['Guilds', 'GuildVoiceStates'] satisfies IntentName[]);
        if (this.bot.config.bot.textCommand) {
            requiredIntents.add('GuildMessages' satisfies IntentName);
            requiredIntents.add('MessageContent' satisfies IntentName);
        }

        // Standard (non-privileged) intents: union of configured and required
        const standardNames = new Set<string>();
        for (const name of configuredSet) {
            if (!PRIVILEGED_INTENTS.has(name)) standardNames.add(name);
        }
        for (const name of requiredIntents) {
            if (!PRIVILEGED_INTENTS.has(name)) standardNames.add(name);
        }

        const standardIntents = [...standardNames]
            .map((name) => ({
                name,
                required: requiredIntents.has(name),
                enabled: configuredSet.has(name),
            }))
            .sort((a, b) => {
                if (a.required !== b.required) return a.required ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

        // Privileged intents: always include all known ones for a complete picture
        const privilegedIntents = [...PRIVILEGED_INTENTS]
            .map((name) => ({
                name,
                required: requiredIntents.has(name),
                enabled: configuredSet.has(name),
            }))
            .sort((a, b) => {
                if (a.required !== b.required) return a.required ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

        // Warn if any privileged intent is enabled that this bot never uses
        const hasExtraPrivileged = [...configuredSet].some(
            (intent) => PRIVILEGED_INTENTS.has(intent) && !BOT_PRIVILEGED_INTENTS.has(intent),
        );

        return ok(res, { standard: standardIntents, privileged: privilegedIntents, hasExtraPrivileged });
    }
}
