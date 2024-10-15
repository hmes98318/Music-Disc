import { loadLocalNode, loadSite, setEnvironment } from "./loader";
import { Logger } from "./lib/Logger";
import { LocalNodeController } from "./lib/localnode/LocalNodeController";
import { ShardingController } from "./ShardingController";
import { getSysInfo } from "./utils/functions/getSysInfo";
import { cst } from "./utils/constants";

import type { Bot, SystemInfo } from "./@types";


export class Controller {
    #bot: Bot;
    #shardManager: ShardingController;
    #localNodeController: LocalNodeController;

    constructor() {
        this.#bot = {
            shardId: -1,
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

        setEnvironment(this.#bot.config);
        this.#bot.logger.emit('shard', 'Set environment variables.');

        this.#shardManager = new ShardingController();

        this.#localNodeController = new LocalNodeController(
            this.#bot.config.localNode.downloadLink,
            this.#bot.logger,
            this.#bot.config.localNode.autoRestart
        );
    }


    public async init() {
        this.#bot.sysInfo = await getSysInfo();

        return Promise.resolve()
            .then(async () => { if (this.#bot.config.enableLocalNode) await loadLocalNode(this.#bot, this.#localNodeController); })
            .then(() => this.#shardManager.spwan())
            .then(async () => { if (this.#bot.config.enableSite) await loadSite(this.#bot, this.#shardManager.manager, this.#localNodeController); })
            .then(() => {
                this.#bot.logger.emit('shard', cst.color.green + '*** ShardingController initialization completed ***' + cst.color.white);
                this.#bot.logger.emit('shard', 'Launching sharding process...');
            });
    }
}