import cookie from "cookie";
import { NodeState } from 'lavashark';

import { sysusage } from '../../utils/functions/sysusage';
import { uptime } from '../../utils/functions/uptime';

import type { Client, VoiceChannel } from 'discord.js';
import type { Server } from 'socket.io';
import type { Bot } from "../../@types";
import type { SessionManager } from '../lib/SessionManager';
import type { LocalNodeController } from "../lib/LocalNodeController";


const registerSocketioEvents = (bot: Bot, client: Client, localNodeController: LocalNodeController, io: Server, sessionManager: SessionManager) => {

    io.on('connection', (socket) => {
        // bot.logger.emit('api', '[socketio] a user connected');


        /**
         * Check for a valid session using the sessionID stored in the client's cookie.
         */
        const sessionCheck = () => {
            const cookies = cookie.parse(socket.request.headers.cookie as string || '');
            const sessionId = cookies.sessionID;
            const session = sessionManager.getSession(sessionId);

            if (!session) return io.disconnectSockets();
        };


        /**
         * bot_status
         * @emits api_bot_status
         */
        socket.on("bot_status", async () => {
            sessionCheck();
            // bot.logger.emit('api', '[api] emit bot_status');

            const systemStatus = {
                load: await sysusage.cpu(),
                memory: sysusage.ram(),
                heap: sysusage.heap(),
                uptime: uptime(bot.sysInfo.startupTime),
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
         * @emits api_nodes_status
         */
        socket.on("nodes_status", async () => {
            sessionCheck();
            // bot.logger.emit('api', '[api] emit nodes_status');

            const nodePromises = client.lavashark.nodes.map(async (node) => {
                if (node.state === NodeState.CONNECTED) {
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

                        return {
                            id: node.identifier,
                            state: node.state,
                            info: nodeInfo,
                            stats: nodeStats,
                            ping: nodePing
                        };
                    } catch (_) {
                        return {
                            id: node.identifier,
                            state: node.state,
                            info: {},
                            stats: {},
                            ping: -1
                        };
                    }
                }
                else {
                    return {
                        id: node.identifier,
                        state: node.state,
                        info: {},
                        stats: {},
                        ping: -1,
                    };
                }
            });

            try {
                const nodesStatus = await Promise.all(nodePromises);
                socket.emit('api_nodes_status', nodesStatus);
            } catch (error) {
                console.error('Error while fetching node data:', error);
            }
        });

        /**
         * lavashark_nowPlaying
         * @emits api_lavashark_nowPlaying
         */
        socket.on("lavashark_nowPlaying", async (guildID: string) => {
            sessionCheck();
            // bot.logger.emit('api', '[api] emit lavashark_nowPlaying');

            const player = client.lavashark.getPlayer(guildID);

            if (!player) {
                socket.emit('api_lavashark_nowPlaying', 'NOT_FOUND');
            }
            else {
                const voiceChannel = client.channels.cache.get(player.voiceChannelId) as VoiceChannel;
                const playingData = {
                    voiceChannel: voiceChannel,
                    members: voiceChannel.members,
                    current: player.current,
                    isPaused: player.paused,
                    repeatMode: player.repeatMode,
                    volume: player.volume,
                    maxVolume: bot.config.maxVolume
                };

                socket.emit('api_lavashark_nowPlaying', playingData);
            }
        });

        /**
         * localnode_active
         * @emits api_localnode_active
         */
        socket.on('localnode_active', () => {
            const isActive = localNodeController.lavalinkPid !== null ? 'ACTIVE' : 'INACTIVE';
            socket.emit('api_localnode_active', isActive);
        });

        /**
         * localnode_update
         * @emits api_localnode_update
         */
        socket.on('localnode_update', (currLogLength: number) => {
            sessionCheck();
            // bot.logger.emit('api', '[api] emit localnode_update');

            const lavalinkLogsLength = localNodeController.lavalinkLogs.length;

            if (currLogLength === lavalinkLogsLength) {
                // No new logs
                socket.emit('api_localnode_update', 'SAME_LENGTH');
            }
            else {
                // Send the new logs since the last update
                const newLogs = localNodeController.lavalinkLogs.slice(currLogLength);
                socket.emit('api_localnode_update', newLogs);
            }
        });

        /**
         * logger_update
         * @emits api_logger_update
         */
        socket.on('logger_update', (currLogLength: number) => {
            sessionCheck();
            // bot.logger.emit('api', '[api] emit logger_update');

            const botLogsLength = bot.logger.logs.length;

            if (currLogLength === botLogsLength) {
                socket.emit('api_logger_update', 'SAME_LENGTH');
            }
            else {
                const newLogs = bot.logger.logs.slice(currLogLength);
                socket.emit('api_logger_update', newLogs);
            }
        });
    });


    io.on('disconnect', (_socket) => {
        // bot.logger.emit('api', '[socketio] a user disconnected');
    });
};

export { registerSocketioEvents };