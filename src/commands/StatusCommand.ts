import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { cst } from '../utils/constants.js';
import { embeds } from '../embeds/index.js';
import { uptime } from '../utils/functions/uptime.js';
import { sysusage } from '../utils/functions/sysusage.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata, SystemStatus } from '../@types/index.js';


export class StatusCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'status',
            aliases: ['info'],
            description: i18next.t('commands:CONFIG_STATUS_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_STATUS_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const botPing = `${Date.now() - context.createdTimestamp}ms`;
        const sysload = await sysusage.cpu();
        const pingList = await client.lavashark.nodesPing();

        // Get nodes status
        const nodes = client.lavashark.nodes;
        const nodesStatus = [];
        let unhealthValue = 0;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const ping = pingList[i];

            if (ping === -1) {
                unhealthValue++;
                nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
            }
            else {
                nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
            }
        }

        // Get playing count from all shards
        const playingResults = await client.shard!.broadcastEval(async (client) => {
            return {
                playing: client.lavashark.players.size
            };
        });

        // Refresh stats if needed
        if (!bot.stats.lastRefresh || ((Date.now() - bot.stats.lastRefresh) > cst.cacheExpiration)) {
            try {
                const statsResults = await client.shard!.broadcastEval(async (client) => {
                    await client.guilds.fetch();

                    return {
                        serverCount: client.guilds.cache.size,
                        totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
                    };
                });

                bot.stats.guildsCount = statsResults.map((shard) => shard.serverCount) || bot.stats.guildsCount;
                bot.stats.lastRefresh = Date.now();
            } catch (error) {
                bot.logger.emit('api', `[${bot.shardId}] Failed to get shard info: ${error}`);
            }
        }

        const totalServerCount = bot.stats.guildsCount.reduce((acc, guilds) => acc + guilds, 0);
        const totalPlaying = playingResults.reduce((acc, shard) => acc + shard.playing, 0);

        const systemStatus: SystemStatus = {
            load: sysload,
            memory: sysusage.ram(),
            heap: sysusage.heap(),
            uptime: uptime(bot.sysInfo.startupTime),
            ping: {
                bot: botPing,
                api: client.ws.ping
            },
            serverCount: totalServerCount,
            playing: totalPlaying
        };

        bot.logger.emit('log', bot.shardId, 'nodesStatus: ' + JSON.stringify(nodesStatus));

        await context.reply({
            embeds: [
                embeds.botStatus(bot, systemStatus),
                embeds.nodesStatus(bot, unhealthValue, nodesStatus)
            ],
            allowedMentions: { repliedUser: false }
        });
    }
}
