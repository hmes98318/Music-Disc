import fs from 'fs';

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { LavaShark } from 'lavashark';

import {
    checkNodesStats,
    loadBlacklist,
    loadCommands,
    loadDiscordEvents,
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
            blacklist: cst.blacklist,
            config: cst.config,
            logger: new Logger(cst.logger.format, cst.logger.logDir),
            sysInfo: {} as SystemInfo,
            stats: {
                guildsCount: [-1],
                membersCount: [-1],
                lastRefresh: null,
            }
        };

        setEnvironment(this.bot.config);
        this.bot.logger.emit('log', this.bot.shardId, 'Set environment variables.');

        loadBlacklist(this.bot);

        this.#client.commands = new Collection();
        this.#client.lavashark = new LavaShark({
            nodes: this.bot.config.nodeList,
            sendWS: (guildId, payload) => { this.#client.guilds.cache.get(guildId)?.shard.send(payload); }
        });
    }


    public async init() {
        return Promise.resolve()
            .then(() => loadDiscordEvents(this.bot, this.#client))
            .then(() => loadLavaSharkEvents(this.bot, this.#client))
            .then(() => loadCommands(this.bot, this.#client))
            .then(() => checkNodesStats(this.bot, this.#client.lavashark))
            .then(() => {
                this.bot.logger.emit('log', this.bot.shardId, cst.color.green + '*** All loaded successfully ***' + cst.color.white);
                this.#client.login(process.env.BOT_TOKEN);
            });
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
