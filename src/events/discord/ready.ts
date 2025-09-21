import { cst } from '../../utils/constants.js';
import { ChannelType, ClientPresenceStatus } from 'discord.js';
import type { Client } from 'discord.js';
import type { Bot } from '../../@types/index.js';

export default async (bot: Bot, client: Client) => {
    // Log login information
    bot.logger.emit('discord', bot.shardId, `>>> Logged in as ${client.user?.username}`);

    // Set client status & activity
    client.user?.setStatus(bot.config.bot.status as ClientPresenceStatus);
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
    }, 10 * 60 * 1000); // every 10 minutes

    // Auto join voice channel after startup
    client.lavashark.once('nodeConnect', async () => {
        if ((bot.shardId + 1 >= (client.shard?.count ?? 1)) && bot.config.bot.startupAutoJoin) {
            const channel = await client.channels.fetch(bot.config.bot.specifyVoiceChannel ?? '0');

            if (!channel || channel.type !== ChannelType.GuildVoice) {
                bot.logger.emit('log', bot.shardId, `The specified voice channel not found, set to disabled. (${bot.config.bot.specifyVoiceChannel})`);
                bot.logger.emit('log', bot.shardId, `The specifyVoiceChannel value is incorrect, set startupAutoJoin to disabled.`);

                bot.config.bot.specifyVoiceChannel = null;
                bot.config.bot.startupAutoJoin = false;

                return;
            }

            // Create the audio player
            const player = client.lavashark.createPlayer({
                guildId: channel.guildId,
                voiceChannelId: channel.id,
                textChannelId: channel.id,
                selfDeaf: true
            });

            if (!player.setting) {
                player.setting = {
                    queuePage: null,
                    volume: null
                };
            }

            try {
                // Connect to the voice channel
                await player.connect();
                bot.logger.emit('log', bot.shardId, `Auto joined voice channel: ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyVoiceChannel})`);
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error during auto join: ' + error);
            }
        }
    });

    client.lavashark.start(String(client.user?.id));

    // Check specified message channel ID
    if (bot.config.bot.specifyMessageChannel) {
        const channel = await client.channels.fetch(bot.config.bot.specifyMessageChannel);

        if (!channel) {
            bot.logger.emit('log', bot.shardId, `The specified message channel not found, set to disabled. (${bot.config.bot.specifyMessageChannel})`);
            bot.config.bot.specifyMessageChannel = null;
        } else {
            bot.logger.emit('log', bot.shardId, `Set specified message channel: ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyMessageChannel})`);
        }
    }

    // Check specified voice channel ID
    if (bot.config.bot.specifyVoiceChannel) {
        const channel = await client.channels.fetch(bot.config.bot.specifyVoiceChannel);

        if (!channel) {
            bot.logger.emit('log', bot.shardId, `The specified voice channel not found, set to disabled. (${bot.config.bot.specifyVoiceChannel})`);
            bot.logger.emit('log', bot.shardId, `The specifyVoiceChannel value is incorrect, set startupAutoJoin to disabled.`);

            bot.config.bot.specifyVoiceChannel = null;
            bot.config.bot.startupAutoJoin = false;
        } else {
            bot.logger.emit('log', bot.shardId, `Set specified voice channel: ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyVoiceChannel})`);

            if (bot.config.bot.startupAutoJoin) {
                bot.logger.emit('log', bot.shardId, `StartupAutoJoin Enabled.`);
            } else {
                bot.logger.emit('log', bot.shardId, `StartupAutoJoin Disabled.`);
            }
        }
    }

    // Set admin user IDs
    bot.logger.emit('log', bot.shardId, `Admin user IDs: ${JSON.stringify(bot.config.bot.admin)}`);

    // Shard launch complete
    bot.logger.emit('log', bot.shardId, `${cst.color.green}*** Launched shard ${bot.shardId + 1} / ${client.shard?.count} ***${cst.color.white}`);
};
