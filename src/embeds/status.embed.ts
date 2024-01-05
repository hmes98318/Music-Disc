import { EmbedBuilder, HexColorString } from "discord.js";
import { formatBytes, msToTime, timestampToTime } from "../utils/functions/unitConverter";

import type { Info, NodeStats } from "lavashark/typings/src/@types";
import type { Config, SystemInfo, SystemStatus } from "../@types";


const botStatus = (config: Config, systemInfo: SystemInfo, systemStatus: SystemStatus) => {
    const cpuUsage = `${systemStatus.load.percent}  \`${systemStatus.load.detail}\``;
    const ramUsage = `${systemStatus.memory.percent}  \`${systemStatus.memory.detail}\``;
    const heapUsage = `${systemStatus.heap.percent}  \`${systemStatus.heap.detail}\``;

    const embed_ = new EmbedBuilder()
        .setColor(config.embedsColor as HexColorString | number)
        .setTitle(`${config.name} ${systemInfo.bot_version}`)
        .setURL('https://github.com/hmes98318/Music-Disc')
        .setDescription(`**• Serving ${systemStatus.serverCount} servers**\n**• Playing on ${systemStatus.playing} servers**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(
            { name: `⚙️ SYSTEM`, value: `OS : **${systemInfo.os_version}**\nNode.js : **${systemInfo.node_version}**\nDiscord.js : **${systemInfo.dc_version}**\nLavaShark : **${systemInfo.shark_version}**\nCPU : **${systemInfo.cpu}**\nUptime : **${systemStatus.uptime}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, inline: false },
            { name: `📊 USAGE`, value: `CPU : **${cpuUsage}**\nRam : **${ramUsage}**\nHeap : **${heapUsage}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, inline: false },
            { name: `🛰️ LATENCY`, value: `Bot : **${systemStatus.ping.bot}**\nAPI : **${systemStatus.ping.api}ms**`, inline: false }
        )
        .setTimestamp();

    return embed_;
};

const nodesStatus = (embedsColor: HexColorString | string | number, nodeHealth: string, nodesStatus: { name: string; value: string; }[]) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`🛰️ Nodes Status`)
        .setDescription(`**${nodeHealth}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(nodesStatus)
        .setTimestamp();

    return embed_;
};

const nodeStatus = (embedsColor: HexColorString | string | number, nodeName: string, nodeInfo: Info, nodeStats: NodeStats, nodePing: number) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`🛰️ Node "${nodeName}" status`)
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(
            { name: `🏷️ INFO`, value: `Version : **${nodeInfo.version.semver}**\nJVM : **${nodeInfo.jvm}**\nLavaplayer : **${nodeInfo.lavaplayer}**\nGit : **${nodeInfo.git.commit}**\nBuild time : **${timestampToTime(nodeInfo.buildTime)}**` },
            { name: `📊 STATS`, value: `uptime : **${msToTime(nodeStats.uptime)}**\nPing : **${nodePing} ms**\nPlayer : **${nodeStats.players}**\nPlaying players : **${nodeStats.playingPlayers}**` },
            { name: `⚙️ CPU`, value: `Cores : **${nodeStats.cpu.cores}**\nSystem load : **${nodeStats.cpu.systemLoad.toFixed(6)}**\nLavalink load : **${nodeStats.cpu.lavalinkLoad.toFixed(6)}**` },
            { name: `📑 MEMORY`, value: `Used : **${formatBytes(nodeStats.memory.used)}**\nFree : **${formatBytes(nodeStats.memory.free)}**\nAllocated : **${formatBytes(nodeStats.memory.allocated)}**\nReservable : **${formatBytes(nodeStats.memory.reservable)}**\n` })
        .setTimestamp();

    return embed_;
};

const nodeDisconnected = (embedsColor: HexColorString | string | number, nodeName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`🛰️ Node "${nodeName}" status`)
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ | **DISCONNECTED**`)
        .setTimestamp();

    return embed_;
};

const validNodeName = (embedsColor: HexColorString | string | number, nodesName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`❌ | Please enter a valid node name.`)
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${nodesName}`)
        .setTimestamp();

    return embed_;
};

export { botStatus, nodeDisconnected, nodesStatus, nodeStatus, validNodeName };