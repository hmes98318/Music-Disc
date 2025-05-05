import { Client, Collection, GatewayIntentBits } from 'discord.js';
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
                membersCount: [-1],
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


        this.#client.commands = new Collection();

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
    }


    public async init() {
        return Promise.resolve()
            .then(() => loadI18Next(this.bot, this.#client))
            .then(() => loadDiscordEvents(this.bot, this.#client))
            .then(() => loadLavaSharkEvents(this.bot, this.#client))
            .then(() => loadCommands(this.bot, this.#client))
            .then(() => checkNodesStats(this.bot, this.#client.lavashark))
            .then(() => {
                this.bot.logger.emit('log', this.bot.shardId, cst.color.green + '*** All loaded successfully ***' + cst.color.white);
                this.#client.login(process.env.BOT_TOKEN);

                this.#setShutdownSignalHandlers();
                this.bot.logger.emit('log', this.bot.shardId, 'pid: ' + process.pid);
            });
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
    app.init();
};

main();


process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
