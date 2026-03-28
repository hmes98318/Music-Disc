import { ChannelType, Events } from 'discord.js';

import { BaseDiscordEvent } from './base/BaseDiscordEvent.js';
import { getSysInfo } from '../../utils/functions/getSysInfo.js';
import { cst } from '../../utils/constants.js';

import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * ClientReady event handler
 * Handles bot initialization after successful Discord connection
 */
export class ClientReadyEvent extends BaseDiscordEvent<Events.ClientReady> {
    public getEventName(): Events.ClientReady {
        return Events.ClientReady;
    }

    public async execute(bot: Bot, client: Client): Promise<void> {
        bot.sysInfo = await getSysInfo();

        const release = {
            bot: `${bot.config.bot.name}: ${cst.color.cyan}${bot.sysInfo.bot_version}${cst.color.white}`,
            nodejs: `Node.js:    ${cst.color.cyan}${bot.sysInfo.node_version}${cst.color.white}`,
            djs: `Discord.js: ${cst.color.cyan}${bot.sysInfo.dc_version}${cst.color.white}`,
            shark: `LavaShark:  ${cst.color.cyan}${bot.sysInfo.shark_version}${cst.color.white}`,
        };

        bot.logger.emit('log', bot.shardId, `+-----------------------+`);
        bot.logger.emit('log', bot.shardId, `| ${release.bot.padEnd(30, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `| ${release.nodejs.padEnd(30, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `| ${release.djs.padEnd(30, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `| ${release.shark.padEnd(30, ' ')} |`);
        bot.logger.emit('log', bot.shardId, `+-----------------------+`);

        await this.#registerSlashCommands(bot, client);
        await this.#initializeLavalink(bot, client);
        this.#setupBotPresence(bot, client);
        await this.#validateConfiguration(bot, client);

        bot.logger.emit('discord', bot.shardId, `>>> Logged in as ${client.user?.username}`);
        bot.logger.emit('log', bot.shardId, `${cst.color.green}*** Launched shard ${bot.shardId + 1} / ${client.shard?.count} ***${cst.color.white}`);
    }

    /**
     * Register slash commands if enabled
     * @private
     */
    async #registerSlashCommands(bot: Bot, client: Client): Promise<void> {
        if (bot.config.bot.slashCommand) {
            bot.logger.emit('log', bot.shardId, 'Enable slash command.');

            const commands = client.commands.getAll();
            const slashCommands = commands.map(cmd => {
                const metadata = cmd.getMetadata(bot);
                return {
                    name: metadata.name,
                    description: metadata.description,
                    options: metadata.options
                };
            });

            await client.application?.commands.set(slashCommands);
        }
        else {
            bot.logger.emit('log', bot.shardId, 'Disable slash command.');
        }
    }

    /**
     * Initialize Lavalink connection and handle auto-join / queue restore
     * @private
     */
    async #initializeLavalink(bot: Bot, client: Client): Promise<void> {
        client.lavashark.once('nodeConnect', async () => {
            if (bot.shardId + 1 >= (client.shard?.count ?? 1)) {
                // Queue persistence restore takes priority over bare auto-join
                if (bot.config.queuePersistence.enabled && (client as any).queuePersistence) {
                    await this.#restorePersistedQueues(bot, client);
                }

                // Auto-join only if no persisted queue was restored for this channel
                if (bot.config.bot.startupAutoJoin) {
                    const qp = (client as any).queuePersistence;
                    const channelId = bot.config.bot.specifyVoiceChannel;
                    const hasPersistedData = qp && channelId && qp.hasPersistedQueueForChannel(channelId);

                    if (!hasPersistedData) {
                        await this.#handleAutoJoin(bot, client);
                    } else {
                        bot.logger.emit('log', bot.shardId, 'Skipping auto-join: queue persistence restored for this channel.');
                    }
                }
            }
        });

        client.lavashark.start(String(client.user?.id));
    }

    /**
     * Restore persisted queues from database on startup
     * @private
     */
    async #restorePersistedQueues(bot: Bot, client: Client): Promise<void> {
        try {
            const queuePersistence = (client as any).queuePersistence;
            if (!queuePersistence) return;

            const queues = queuePersistence.loadQueues(client);

            for (const queueData of queues) {
                await queuePersistence.restoreQueue(client, queueData);
            }

            if (queues.length > 0) {
                bot.logger.emit('log', bot.shardId, `Restored ${queues.length} persisted queue(s) on startup.`);
            }
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `Failed to restore persisted queues: ${error}`);
        }
    }

    /**
     * Handle automatic voice channel join on startup
     * @private
     */
    async #handleAutoJoin(bot: Bot, client: Client): Promise<void> {
        const channel = await client.channels.fetch(bot.config.bot.specifyVoiceChannel ?? '0');

        if (!channel || channel.type !== ChannelType.GuildVoice) {
            bot.logger.emit('log', bot.shardId, `The specified voice channel not found, set to disabled. (${bot.config.bot.specifyVoiceChannel})`);
            bot.logger.emit('log', bot.shardId, `The specifyVoiceChannel value is incorrect, set startupAutoJoin to disabled.`);

            bot.config.bot.specifyVoiceChannel = null;
            bot.config.bot.startupAutoJoin = false;

            return;
        }

        // Creates the audio player
        const player = client.lavashark.createPlayer({
            guildId: channel.guildId,
            voiceChannelId: channel.id,
            textChannelId: channel.id,
            selfDeaf: true
        });

        if (!player.setting) {
            player.setting = {
                queuePage: null,
                volume: null,
                fairQueueRotation: []
            };
        }

        try {
            // Connects to the voice channel
            await player.connect();
            bot.logger.emit('log', bot.shardId, `Auto join voice channel : ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyVoiceChannel})`);

            // Set idle voice status after auto-join
            if (bot.config.bot.voiceStatusIdleText && bot.config.bot.voiceStatusEmojis.length > 0) {
                const { setIdleVoiceStatus } = await import('../../utils/functions/setVoiceStatus.js');
                await setIdleVoiceStatus(bot, client, channel.id);
            }
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Error startup auto joining channel: ' + error);
        }
    }

    /**
     * Setup bot presence (status and activity)
     * @private
     */
    #setupBotPresence(bot: Bot, client: Client): void {
        client.user?.setStatus(bot.config.bot.status);
        client.user?.setActivity({
            name: bot.config.bot.activity.name,
            type: bot.config.bot.activity.type,
            state: bot.config.bot.activity.state,
            url: bot.config.bot.activity.url
        });

        // Prevent the disappearance of the activity status
        setInterval(() => {
            client.user?.setActivity({
                name: bot.config.bot.activity.name,
                type: bot.config.bot.activity.type,
                state: bot.config.bot.activity.state,
                url: bot.config.bot.activity.url
            });
        }, 10 * 60 * 1000); // 10 minutes
    }

    /**
     * Validate and log configuration settings
     * @private
     */
    async #validateConfiguration(bot: Bot, client: Client): Promise<void> {
        // Check specify message channel ID
        if (bot.config.bot.specifyMessageChannel) {
            const channel = await client.channels.fetch(bot.config.bot.specifyMessageChannel);

            if (!channel) {
                bot.logger.emit('log', bot.shardId, `The specified message channel not found, set to disabled. (${bot.config.bot.specifyMessageChannel})`);
                bot.config.bot.specifyMessageChannel = null;
            }
            else {
                bot.logger.emit('log', bot.shardId, `Set specify message channel : ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyMessageChannel})`);
            }
        }

        // Check specify voice channel ID
        if (bot.config.bot.specifyVoiceChannel) {
            const channel = await client.channels.fetch(bot.config.bot.specifyVoiceChannel);

            if (!channel) {
                bot.logger.emit('log', bot.shardId, `The specified voice channel not found, set to disabled. (${bot.config.bot.specifyVoiceChannel})`);
                bot.logger.emit('log', bot.shardId, `The specifyVoiceChannel value is incorrect, set startupAutoJoin to disabled.`);

                bot.config.bot.specifyVoiceChannel = null;
                bot.config.bot.startupAutoJoin = false;
            }
            else {
                bot.logger.emit('log', bot.shardId, `Set specify voice channel : ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyVoiceChannel})`);

                if (bot.config.bot.startupAutoJoin) {
                    bot.logger.emit('log', bot.shardId, `Set startupAutoJoin Enabled.`);
                }
                else {
                    bot.logger.emit('log', bot.shardId, `Set startupAutoJoin to disabled.`);
                }
            }
        }

        bot.logger.emit('log', bot.shardId, `Set admin as user ID : ${JSON.stringify(bot.config.bot.admin)}`);
    }
}
