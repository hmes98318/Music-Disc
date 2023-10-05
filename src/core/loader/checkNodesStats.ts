import { cst } from '../../utils/constants';
import type { Client } from 'discord.js';


const checkNodesStats = async (client: Client) => {
    console.log(`-> Checking stats for all nodes ......`);

    try {
        const nodes = client.lavashark.nodes;
        const pingList = await client.lavashark.nodesPing();

        console.log(`+--------------------------------+`);
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const ping = pingList[i];

            if (ping === -1) {
                console.log(`| ${node.identifier}: ${cst.color.red}DISCONNECTED${cst.color.white}`.padEnd(42, ' ') + '|');
            }
            else {
                console.log(`| ${node.identifier}: ${cst.color.green}CONNECTED${cst.color.white}${cst.color.grey} (${ping}ms)${cst.color.white}`.padEnd(50, ' ') + '|');
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- All node stats have been checked --${cst.color.white}`);
    } catch (error) {
        console.error('Error checkNodesStats:', error);
    }
};

export { checkNodesStats };