import { loadControllerI18Next, loadLocalNode, loadSite, setEnvironment } from './loader/index.js';
import { Logger } from './lib/Logger.js';
import { LocalNodeController } from './lib/localnode/LocalNodeController.js';
import { ShardingController } from './ShardingController.js';
import { getSysInfo } from './utils/functions/getSysInfo.js';
import { cst } from './utils/constants.js';

import type { Bot, SystemInfo } from './@types/index.js';


export class Controller {
    #bot: Bot;
    #shardManager: ShardingController;
    #localNodeController: LocalNodeController;

    constructor() {
        this.#bot = {
            shardId: -1,
            blacklist: cst.config.blacklist,
            config: cst.config,
            logger: new Logger(cst.logger.format, cst.logger.logDir),
            sysInfo: {} as SystemInfo,
            stats: {
                guildsCount: [-1],
                membersCount: [-1],
                lastRefresh: null,
            },
            i18n: null,
            lang: null
        } as unknown as Bot;

        setEnvironment(this.#bot.config);
        this.#bot.logger.emit('shard', 'Set environment variables.');

        this.#shardManager = new ShardingController();

        this.#localNodeController = new LocalNodeController(
            this.#bot.config.localNode.downloadLink!,
            this.#bot.logger,
            this.#bot.config.localNode.autoRestart
        );
    }


    public async init() {
        this.#bot.sysInfo = await getSysInfo();

        return Promise.resolve()
            .then(() => loadControllerI18Next(this.#bot))
            .then(async () => { if (this.#bot.config.localNode.enabled) await loadLocalNode(this.#bot, this.#localNodeController); })
            .then(() => this.#shardManager.spwan())
            .then(async () => { if (this.#bot.config.webDashboard.enabled) await loadSite(this.#bot, this.#shardManager.manager, this.#localNodeController); })
            .then(() => {
                this.#bot.logger.emit('shard', cst.color.green + '*** ShardingController initialization completed ***' + cst.color.white);
                this.#bot.logger.emit('shard', 'Launching sharding process...');
            });
    }
}