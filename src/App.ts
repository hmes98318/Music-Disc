import { Client, GatewayIntentBits } from 'discord.js';
import { LavaShark } from 'lavashark';

import {
    checkNodesStats,
    loadCommands,
    loadDiscordEvents,
    loadI18Next,
    loadLavaSharkEvents,
    setEnvironment
} from './loader/index.js';
import { Logger } from './lib/Logger.js';
import { BlacklistManager } from './lib/BlacklistManager.js';
import { DashboardManager } from './lib/DashboardManager.js';
import { QueuePersistence } from './lib/QueuePersistence.js';
import { cst } from './utils/constants.js';

import type { Bot, SystemInfo } from './@types/index.js';


class App {
    public bot: Bot;
    #client: Client;

    constructor() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ]
        });

        this.bot = {
            shardId: this.#client.shard?.ids[0] ?? -1,
            blacklist: cst.config.blacklist,
            config: cst.config,
            logger: new Logger(cst.logger.format, cst.logger.logDir),
            sysInfo: {} as SystemInfo,
            stats: {
                guildsCount: [-1],
                lastRefresh: null,
            }
        } as any;

        setEnvironment(this.bot.config);
        this.bot.logger.emit('log', this.bot.shardId, 'Set environment variables.');

        if (this.bot.config.blacklist.length > 0) {
            this.bot.logger.emit('log', this.bot.shardId, 'Blacklist loaded: ' + this.bot.config.blacklist.length + ' users');
        }
        else {
            this.bot.logger.emit('log', this.bot.shardId, 'No blacklist entries found.');
        }

        if (this.bot.config.spotify.clientId && this.bot.config.spotify.clientSecret) {
            this.#client.lavashark = new LavaShark({
                nodes: this.bot.config.nodeList,
                sendWS: (guildId, payload) => { this.#client.guilds.cache.get(guildId)?.shard.send(payload); },
                spotify: {
                    clientId: this.bot.config.spotify.clientId,
                    clientSecret: this.bot.config.spotify.clientSecret
                }
            });

            this.bot.logger.emit('log', this.bot.shardId, 'Spotify credentials configured.');
        }
        else {
            this.#client.lavashark = new LavaShark({
                nodes: this.bot.config.nodeList,
                sendWS: (guildId, payload) => { this.#client.guilds.cache.get(guildId)?.shard.send(payload); }
            });

            this.bot.logger.emit('log', this.bot.shardId, 'Spotify credentials not configured.');
        }

        // Initialize dashboard manager
        this.#client.dashboard = new DashboardManager(this.bot, this.#client);
        this.bot.logger.emit('log', this.bot.shardId, 'Dashboard manager initialized.');

        // Initialize last played tracks map
        this.#client.lastPlayedTracks = new Map();

        // Initialize dynamic blacklist manager
        this.bot.blacklistManager = new BlacklistManager(this.bot);
        this.bot.blacklistManager.initialize();

        // Initialize queue persistence
        if (this.bot.config.queuePersistence.enabled) {
            (this.#client as any).queuePersistence = new QueuePersistence(this.bot);
            (this.#client as any).queuePersistence.initialize();
        }
    }


    public async init() {
        return Promise.resolve()
            .then(() => loadI18Next(this.bot, this.#client))
            .then(() => loadDiscordEvents(this.bot, this.#client))
            .then(() => loadLavaSharkEvents(this.bot, this.#client))
            .then(() => loadCommands(this.bot, this.#client))
            .then(() => checkNodesStats(this.bot, this.#client.lavashark))
            .then(async () => {
                this.bot.logger.emit('log', this.bot.shardId, cst.color.green + '*** All loaded successfully ***' + cst.color.white);
                await this.#client.login(process.env.BOT_TOKEN);

                // Restore persisted queues after bot is ready
                if (this.bot.config.queuePersistence.enabled) {
                    this.#client.once('ready', () => {
                        this.#restorePersistedQueues();
                    });
                }

                this.#setShutdownSignalHandlers();
                this.bot.logger.emit('log', this.bot.shardId, 'pid: ' + process.pid);
            });
    }

    /**
     * Restore persisted queues from database
     * @private
     */
    async #restorePersistedQueues(): Promise<void> {
        try {
            const queuePersistence = (this.#client as any).queuePersistence;
            if (!queuePersistence) return;

            // Wait for bot and Lavalink nodes to be fully ready
            await new Promise(resolve => setTimeout(resolve, 5000));

            const queues = queuePersistence.loadQueues(this.#client);
            
            for (const queueData of queues) {
                await queuePersistence.restoreQueue(this.#client, queueData);
            }
        } catch (error) {
            this.bot.logger.emit('error', this.bot.shardId, `Failed to restore persisted queues: ${error}`);
        }
    }


    /**
     * Set shutdown signal handlers for SIGINT and SIGTERM
     * @private
     */
    #setShutdownSignalHandlers(): void {
        const shutdown = async (signal: string) => {
            this.bot.logger.emit('log', this.bot.shardId, `Received ${signal}. Closing server gracefully...`);

            const timeout = setTimeout(() => {
                this.bot.logger.emit('log', this.bot.shardId, `Force shutting down due to timeout...`);
                process.exit(1);
            }, 30 * 1000);

            try {
                // Save all active queues before shutdown
                if (this.bot.config.queuePersistence.enabled && (this.#client as any).queuePersistence) {
                    this.bot.logger.emit('log', this.bot.shardId, 'Saving active queues before shutdown...');
                    for (const player of this.#client.lavashark.players.values()) {
                        await (this.#client as any).queuePersistence.saveQueue(player);
                    }
                }

                // Close the lavashark players connections
                this.bot.logger.emit('log', this.bot.shardId, 'Closing voice channel connection...');
                await Promise.allSettled(
                    Array.from(this.#client.lavashark.players.values()).map(player => player.destroy())
                );
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.bot.logger.emit('log', this.bot.shardId, 'Voice channel connection closed.');

                // Close the lavashark nodes connections
                this.bot.logger.emit('log', this.bot.shardId, 'Closing lavashark nodes...');
                for (const node of this.#client.lavashark.nodes) {
                    node.disconnect();
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.bot.logger.emit('log', this.bot.shardId, 'Lavashark nodes closed.');

                // Close discord.js connection
                this.bot.logger.emit('log', this.bot.shardId, 'Closing discord.js connection...');
                await this.#client.destroy();
                this.bot.logger.emit('log', this.bot.shardId, 'Discord.js connection closed.');

                // Close queue persistence database
                if (this.bot.config.queuePersistence.enabled && (this.#client as any).queuePersistence) {
                    this.bot.logger.emit('log', this.bot.shardId, 'Closing queue persistence database...');
                    (this.#client as any).queuePersistence.close();
                }

                // Close blacklist manager database
                if (this.bot.blacklistManager) {
                    this.bot.logger.emit('log', this.bot.shardId, 'Closing blacklist database...');
                    this.bot.blacklistManager.close();
                }

                clearTimeout(timeout);
                this.bot.logger.emit('log', this.bot.shardId, 'Server closed gracefully.');

                process.exit(0);
            } catch (error) {
                this.bot.logger.emit('error', this.bot.shardId, `Error during shutdown: ${error}`);
                clearTimeout(timeout);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
}


const main = async () => {
    const app = new App();
    await app.init();
};

main();


process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
