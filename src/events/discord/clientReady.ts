import { ChannelType, Client, ClientPresenceStatus } from 'discord.js';
import { getSysInfo } from '../../utils/functions/getSysInfo.js';
import { cst } from '../../utils/constants.js';

import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client) => {
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


    if (bot.config.bot.slashCommand) {
        bot.logger.emit('log', bot.shardId, 'Enable slash command.');
        client.application?.commands.set(client.commands.map(cmd => {
            return {
                name: cmd.name,
                description: cmd.description,
                options: cmd.options
            };
        }));
    }
    else {
        bot.logger.emit('log', bot.shardId, 'Disable slash command.');
    }


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
                    volume: null
                };
            }


            try {
                // Connects to the voice channel
                await player.connect();
                bot.logger.emit('log', bot.shardId, `Auto join voice channel : ${(channel as any).name || 'Unknown channel'} (${bot.config.bot.specifyVoiceChannel})`);
            } catch (error) {
                bot.logger.emit('error', bot.shardId, 'Error startup auto joining channel: ' + error);
            }
        }
    });

    client.lavashark.start(String(client.user?.id));
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
    }, 10 * 60 * 1000); // 10 minutes


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
    bot.logger.emit('discord', bot.shardId, `>>> Logged in as ${client.user?.username}`);


    bot.logger.emit('log', bot.shardId, `${cst.color.green}*** Launched shard ${bot.shardId + 1} / ${client.shard?.count} ***${cst.color.white}`);
};
