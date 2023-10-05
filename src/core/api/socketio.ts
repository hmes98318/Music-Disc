import { sysusage } from '../../utils/functions/sysusage';
import { uptime } from '../../utils/functions/uptime';

import type { Server } from 'socket.io';
import type { Client } from 'discord.js';


const registerSocketioEvents = (client: Client, io: Server) => {

    io.on('connection', (socket) => {
        console.log('[socketio] a user connected');

        /**
         * bot_status
         */
        socket.on("bot_status", async () => {
            console.log('[api] emit bot_status');

            const systemStatus = {
                load: await sysusage.cpu(),
                memory: sysusage.ram(),
                heap: sysusage.heap(),
                uptime: uptime(client.info.startupTime),
                ping: {
                    bot: -1,
                    api: client.ws.ping
                },
                serverCount: client.guilds.cache.size,
                playing: client.lavashark.players.size
            };

            socket.emit('api_bot_status', systemStatus);
        });

        /**
         * nodes_status
         */
        socket.on("nodes_status", async () => {
            console.log('[api] emit nodes_status');

            let nodesStatus = [];
            for (const node of client.lavashark.nodes) {
                try {
                    const nodeInfoPromise = node.getInfo();
                    const nodeStatsPromise = node.getStats();
                    const nodePingPromise = client.lavashark.nodePing(node);
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new Error(`nodes_status "${node.identifier}" Timeout`));
                        }, 1500);
                    });

                    const [nodeInfo, nodeStats, nodePing] = await (Promise.race([Promise.all([nodeInfoPromise, nodeStatsPromise, nodePingPromise]), timeoutPromise]) as Promise<[(typeof nodeInfoPromise), (typeof nodeStatsPromise), (typeof nodePingPromise)]>);

                    nodesStatus.push({
                        id: node.identifier,
                        state: node.state,
                        info: nodeInfo,
                        stats: nodeStats,
                        ping: nodePing
                    });
                } catch (_) {
                    nodesStatus.push({
                        id: node.identifier,
                        state: node.state,
                        info: {},
                        stats: {},
                        ping: -1
                    });
                }
            }

            socket.emit('api_nodes_status', nodesStatus);
        });
    });


    io.on('disconnect', (socket) => {
        console.log('[socketio] a user disconnected');
    });
};

export { registerSocketioEvents };