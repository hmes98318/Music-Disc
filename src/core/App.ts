import {
    checkNodesStats,
    loadSite,
    loadBlacklist,
    loadCommands,
    loadDiscordEvents,
    loadLavaSharkEvents,
    loadLocalNode,
    setEnvironment
} from './loader';

import { LocalNodeController } from './lib/LocalNodeController';
import { Logger } from './lib/Logger';
import { cst } from '../utils/constants';

import type { Client } from 'discord.js';
import type { Bot, SystemInfo } from '../@types';


export class App {
    public bot: Bot;

    #client: Client;
    #localNodeController: LocalNodeController;

    constructor(client: Client) {
        this.#client = client;

        this.bot = {
            blacklist: cst.blacklist,
            config: cst.config,
            logger: new Logger('yyyy/mm/dd HH:MM:ss'),
            sysInfo: {} as SystemInfo
        };
        setEnvironment(this.bot);
        loadBlacklist(this.bot);

        this.#localNodeController = new LocalNodeController();
        this.#localNodeController.logger = this.bot.logger;
        this.#localNodeController.autoRestart = this.bot.config.localNode.autoRestart;
        this.#localNodeController.downloadLink = this.bot.config.localNode.downloadLink;
    }


    public async initialize() {
        return Promise.resolve()
            .then(async () => { if (this.bot.config.enableLocalNode) await loadLocalNode(this.bot, this.#localNodeController); })
            .then(() => loadDiscordEvents(this.bot, this.#client))
            .then(() => loadLavaSharkEvents(this.bot, this.#client))
            .then(() => loadCommands(this.bot, this.#client))
            .then(async () => { if (this.bot.config.enableSite) await loadSite(this.bot, this.#client, this.#localNodeController); })
            .then(() => checkNodesStats(this.bot, this.#client.lavashark))
            .then(() => {
                this.bot.logger.emit('log', cst.color.green + '*** All loaded successfully ***' + cst.color.white);
                this.#client.login(process.env.BOT_TOKEN);
            });
    }
}