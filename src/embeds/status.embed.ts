import { EmbedBuilder, HexColorString } from 'discord.js';
import { formatBytes, msToTime, timestampToTime } from '../utils/functions/unitConverter.js';
import type { Bot } from '../@types/index.js';

import type { Info, NodeStats } from 'lavashark/typings/src/@types/Node.types.js';
import type { SystemStatus } from '../@types/index.js';


const botStatus = (bot: Bot, systemStatus: SystemStatus, lng?: string) => {
    const cpuUsage = `${systemStatus.load.percent}  \`${systemStatus.load.detail}\``;
    const ramUsage = `${systemStatus.memory.percent}  \`${systemStatus.memory.detail}\``;
    const heapUsage = `${systemStatus.heap.percent}  \`${systemStatus.heap.detail}\``;

    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(`${bot.config.bot.name} ${bot.sysInfo.bot_version}`)
        .setURL('https://github.com/hmes98318/Music-Disc')
        .setDescription(bot.i18n.t('embeds:STATUS_DESCRIPTION', { serverCount: systemStatus.serverCount, playingCount: systemStatus.playing, lng }))
        .addFields(
            { name: bot.i18n.t('embeds:STATUS_SYSTEM_TITLE', { lng }), value: bot.i18n.t('embeds:STATUS_SYSTEM_VALUE', { os_version: bot.sysInfo.os_version, node_version: bot.sysInfo.node_version, dc_version: bot.sysInfo.dc_version, shark_version: bot.sysInfo.shark_version, cpu: bot.sysInfo.cpu, uptime: systemStatus.uptime, lng }), inline: false },
            { name: bot.i18n.t('embeds:STATUS_USAGE_TITLE', { lng }), value: bot.i18n.t('embeds:STATUS_USAGE_VALUE', { cpuUsage: cpuUsage, ramUsage: ramUsage, heapUsage: heapUsage, lng }), inline: false },
            { name: bot.i18n.t('embeds:STATUS_LATENCY_TITLE', { lng }), value: bot.i18n.t('embeds:STATUS_LATENCY_VALUE', { botPing: systemStatus.ping.bot, apiPing: systemStatus.ping.api, lng }), inline: false }
        )
        .setTimestamp();

    return embed_;
};

const maintainNotice = (bot: Bot, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.warning as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MAINTAIN_TITLE', { lng }))
        .setDescription(bot.i18n.t('embeds:MAINTAIN_DESCRIPTION', { lng }))
        .setTimestamp();

    return embed_;
};

const nodesStatus = (bot: Bot, unhealthValue: number, nodesStatus: { name: string; value: string; }[], lng?: string) => {
    const healthString = unhealthValue > 0 ? bot.i18n.t('embeds:NODE_UNHEALTHY', { unhealthValue: unhealthValue, lng }) : bot.i18n.t('embeds:NODE_ALL_ACTIVE', { lng });
    const embedColor = unhealthValue > 0 ? bot.config.bot.embedsColors.warning : bot.config.bot.embedsColors.success;

    const embed_ = new EmbedBuilder()
        .setColor(embedColor as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE', { lng }))
        .setDescription(`**${healthString}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(nodesStatus)
        .setTimestamp();

    return embed_;
};

const nodeStatus = (bot: Bot, nodeName: string, nodeInfo: Info, nodeStats: NodeStats, nodePing: number, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.success as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE_2', { nodeName: nodeName, lng }))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(
            { name: bot.i18n.t('embeds:NODE_STATUS_INFO_TITLE', { lng }), value: bot.i18n.t('embeds:NODE_STATUS_INFO_VALUE', { version: nodeInfo.version.semver, jvm: nodeInfo.jvm, lavaplayer: nodeInfo.lavaplayer, git: nodeInfo.git.commit, buildTime: timestampToTime(nodeInfo.buildTime), lng }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_STATS_TITLE', { lng }), value: bot.i18n.t('embeds:NODE_STATUS_STATS_VALUE', { uptime: msToTime(nodeStats.uptime), pingKey: bot.i18n.t('embeds:NODE_STATUS_PING', { lng }), nodePing: nodePing, playerCount: nodeStats.players, playingCount: nodeStats.playingPlayers, lng }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_CPU_TITLE', { lng }), value: bot.i18n.t('embeds:NODE_STATUS_CPU_VALUE', { cores: nodeStats.cpu.cores, systemLoad: nodeStats.cpu.systemLoad.toFixed(6), lavalinkLoad: nodeStats.cpu.lavalinkLoad.toFixed(6), lng }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_MEMORY_TITLE', { lng }), value: bot.i18n.t('embeds:NODE_STATUS_MEMORY_VALUE', { used: formatBytes(nodeStats.memory.used), free: formatBytes(nodeStats.memory.free), allocated: formatBytes(nodeStats.memory.allocated), reservable: formatBytes(nodeStats.memory.reservable), lng }) })
        .setTimestamp();

    return embed_;
};

const nodeDisconnected = (bot: Bot, nodeName: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.error as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE_2', { nodeName: nodeName, lng }))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ㅣ${bot.i18n.t('embeds:NODE_DISCONNECTED', { lng })}`)
        .setTimestamp();

    return embed_;
};

const validNodeName = (bot: Bot, nodesName: string, lng?: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.error as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_ARGS_ERROR', { lng }))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${nodesName}`)
        .setTimestamp();

    return embed_;
};

export { botStatus, maintainNotice, nodeDisconnected, nodesStatus, nodeStatus, validNodeName };