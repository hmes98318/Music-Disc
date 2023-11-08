import cookie from "cookie";
import { NodeState } from 'lavashark';

import { sysusage } from '../../utils/functions/sysusage';
import { uptime } from '../../utils/functions/uptime';

import type { Client, VoiceChannel } from 'discord.js';
import type { Server } from 'socket.io';
import type { SessionManager } from '../lib/SessionManager';


const registerSocketioEvents = (client: Client, io: Server, sessionManager: SessionManager) => {

    io.on('connection', (socket) => {
        // console.log('[socketio] a user connected');


        /**
         * Check for a valid session using the sessionID stored in the client's cookie.
         */
        const sessionCheck = () => {
            const cookies = cookie.parse(socket.request.headers.cookie as string || '');
            const sessionId = cookies.sessionID;
            const session = sessionManager.getSession(sessionId)

            if (!session) return io.disconnectSockets();
        }


        /**
         * bot_status
         * @emits api_bot_status
         */
        socket.on("bot_status", async () => {
            sessionCheck();
            // console.log('[api] emit bot_status');

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
         * @emits api_nodes_status
         */
        socket.on("nodes_status", async () => {
            sessionCheck();
            // console.log('[api] emit nodes_status');

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
            // console.log('[api] emit lavashark_nowPlaying');

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
                    maxVolume: client.config.maxVolume
                };

                socket.emit('api_lavashark_nowPlaying', playingData);
            }
        });
    });


    io.on('disconnect', (socket) => {
        // console.log('[socketio] a user disconnected');
    });
};

export { registerSocketioEvents };