import { EmbedBuilder, HexColorString } from 'discord.js';
import { formatBytes, msToTime, timestampToTime } from '../utils/functions/unitConverter.js';
import type { Bot } from '../@types/index.js';

import type { Info, NodeStats } from 'lavashark/typings/src/@types/Node.types.js';
import type { SystemStatus } from '../@types/index.js';


const botStatus = (bot: Bot, systemStatus: SystemStatus) => {
    const cpuUsage = `${systemStatus.load.percent}  \`${systemStatus.load.detail}\``;
    const ramUsage = `${systemStatus.memory.percent}  \`${systemStatus.memory.detail}\``;
    const heapUsage = `${systemStatus.heap.percent}  \`${systemStatus.heap.detail}\``;

    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.message as HexColorString | number)
        .setTitle(`${bot.config.bot.name} ${bot.sysInfo.bot_version}`)
        .setURL('https://github.com/hmes98318/Music-Disc')
        .setDescription(bot.i18n.t('embeds:STATUS_DESCRIPTION', { serverCount: systemStatus.serverCount, playingCount: systemStatus.playing }))
        .addFields(
            { name: bot.i18n.t('embeds:STATUS_SYSTEM_TITLE'), value: bot.i18n.t('embeds:STATUS_SYSTEM_VALUE', { os_version: bot.sysInfo.os_version, node_version: bot.sysInfo.node_version, dc_version: bot.sysInfo.dc_version, shark_version: bot.sysInfo.shark_version, cpu: bot.sysInfo.cpu, uptime: systemStatus.uptime }), inline: false },
            { name: bot.i18n.t('embeds:STATUS_USAGE_TITLE'), value: bot.i18n.t('embeds:STATUS_USAGE_VALUE', { cpuUsage: cpuUsage, ramUsage: ramUsage, heapUsage: heapUsage }), inline: false },
            { name: bot.i18n.t('embeds:STATUS_LATENCY_TITLE'), value: bot.i18n.t('embeds:STATUS_LATENCY_VALUE', { botPing: systemStatus.ping.bot, apiPing: systemStatus.ping.api }), inline: false }
        )
        .setTimestamp();

    return embed_;
};

const maintainNotice = (bot: Bot) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.warning as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:MAINTAIN_TITLE'))
        .setDescription(bot.i18n.t('embeds:MAINTAIN_DESCRIPTION'))
        .setTimestamp();

    return embed_;
};

const nodesStatus = (bot: Bot, unhealthValue: number, nodesStatus: { name: string; value: string; }[]) => {
    const healthString = unhealthValue > 0 ? bot.i18n.t('embeds:NODE_UNHEALTHY', { unhealthValue: unhealthValue }) : bot.i18n.t('embeds:NODE_ALL_ACTIVE');
    const embedColor = unhealthValue > 0 ? bot.config.bot.embedsColors.warning : bot.config.bot.embedsColors.success;

    const embed_ = new EmbedBuilder()
        .setColor(embedColor as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE'))
        .setDescription(`**${healthString}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(nodesStatus)
        .setTimestamp();

    return embed_;
};

const nodeStatus = (bot: Bot, nodeName: string, nodeInfo: Info, nodeStats: NodeStats, nodePing: number) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.success as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE_2', { nodeName: nodeName }))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .addFields(
            { name: bot.i18n.t('embeds:NODE_STATUS_INFO_TITLE'), value: bot.i18n.t('embeds:NODE_STATUS_INFO_VALUE', { version: nodeInfo.version.semver, jvm: nodeInfo.jvm, lavaplayer: nodeInfo.lavaplayer, git: nodeInfo.git.commit, buildTime: timestampToTime(nodeInfo.buildTime) }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_STATS_TITLE'), value: bot.i18n.t('embeds:NODE_STATUS_STATS_VALUE', { uptime: msToTime(nodeStats.uptime), nodePing: nodePing, playerCount: nodeStats.players, playingCount: nodeStats.playingPlayers }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_CPU_TITLE'), value: bot.i18n.t('embeds:NODE_STATUS_CPU_VALUE', { cores: nodeStats.cpu.cores, systemLoad: nodeStats.cpu.systemLoad.toFixed(6), lavalinkLoad: nodeStats.cpu.lavalinkLoad.toFixed(6) }) },
            { name: bot.i18n.t('embeds:NODE_STATUS_MEMORY_TITLE'), value: bot.i18n.t('embeds:NODE_STATUS_MEMORY_VALUE', { used: formatBytes(nodeStats.memory.used), free: formatBytes(nodeStats.memory.free), allocated: formatBytes(nodeStats.memory.allocated), reservable: formatBytes(nodeStats.memory.reservable) }) })
        .setTimestamp();

    return embed_;
};

const nodeDisconnected = (bot: Bot, nodeName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.error as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_TITLE_2', { nodeName: nodeName }))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ | **DISCONNECTED**`)
        .setTimestamp();

    return embed_;
};

const validNodeName = (bot: Bot, nodesName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(bot.config.bot.embedsColors.error as HexColorString | number)
        .setTitle(bot.i18n.t('embeds:NODE_STATUS_ARGS_ERROR'))
        .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${nodesName}`)
        .setTimestamp();

    return embed_;
};

export { botStatus, maintainNotice, nodeDisconnected, nodesStatus, nodeStatus, validNodeName };