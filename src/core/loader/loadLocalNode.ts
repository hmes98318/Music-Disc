import { cst } from '../../utils/constants';
import { LocalNodeController } from '../lib/LocalNodeController';

import type { Client } from 'discord.js';


const loadLocalNode = (_client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        console.log(`-> loading local Lavalink node ......`);

        const nodeController = new LocalNodeController();
        const hasJava = await nodeController.checkJavaVersion(true);

        if (!hasJava) {
            console.error(cst.color.yellow + '[LocalNode] *** Java is not installed. Please install Java to run local Lavalink node. ***' + cst.color.white);
            console.log('[LocalNode] Local Lavalink node failed to start.');
            return resolve();
        }

        await nodeController.initialize()
            .catch((error) => reject(error));

        const nodeInfo = {
            version: `LavaLink: ${('v' + nodeController.lavalinkVersion).padStart(8, ' ')}`,
            port: `Port:   ${nodeController.port.toString().padStart(10, ' ')}`
        };

        console.log(`+--------------------+`);
        console.log(`| ${nodeInfo.version.padEnd(15, ' ')} |`);
        console.log(`| ${nodeInfo.port.padEnd(15, ' ')} |`);
        console.log(`+--------------------+`);

        console.log(cst.color.grey + '-- loading local Lavalink node finished --' + cst.color.white);
        resolve();
    });
};

export { loadLocalNode };