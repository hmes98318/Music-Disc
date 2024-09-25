import { cst } from './../utils/constants';

import type { LocalNodeController } from '../lib/localnode/LocalNodeController';
import type { Bot } from './../@types';


const loadLocalNode = (bot: Bot, localNodeController: LocalNodeController) => {
    return new Promise<void>(async (resolve, reject) => {
        bot.logger.emit('log', bot.shardId, `-> loading local Lavalink node ......`);

        const hasJava = await localNodeController.checkJavaVersion(true);

        if (!hasJava) {
            bot.logger.emit('localNode', cst.color.yellow + '*** Java is not installed. Please install Java to run local Lavalink node. ***' + cst.color.white);
            bot.logger.emit('localNode', 'Local Lavalink node failed to start.');
            return resolve();
        }

        await localNodeController.initialize()
            .catch((error) => reject(error));

        const nodeInfo = {
            active: `LavaLink: ${(localNodeController.lavalinkPid !== null ? 'ACTIVE' : 'INACTIVE').padStart(8, ' ')}`,
            port: `Port:   ${localNodeController.port.toString().padStart(10, ' ')}`
        };

        bot.logger.emit('log', bot.shardId, `+--------------------+`);
        bot.logger.emit('log', bot.shardId, `| ${nodeInfo.active.padEnd(15, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `| ${nodeInfo.port.padEnd(15, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `+--------------------+`);

        bot.logger.emit('log', bot.shardId, cst.color.grey + '-- loading local Lavalink node finished --' + cst.color.white);
        resolve();
    });
};

export { loadLocalNode };