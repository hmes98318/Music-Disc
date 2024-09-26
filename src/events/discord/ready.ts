import { Client, ClientPresenceStatus } from 'discord.js';
import { getSysInfo } from '../../utils/functions/getSysInfo';
import { cst } from '../../utils/constants';

import type { Bot } from "../../@types";


export default async (bot: Bot, client: Client) => {
    bot.sysInfo = await getSysInfo();

    const release = {
        bot: `${bot.config.name}: ${cst.color.cyan}${bot.sysInfo.bot_version}${cst.color.white}`,
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


    if (bot.config.slashCommand) {
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


    client.lavashark.start(String(client.user?.id));
    client.user?.setStatus(bot.config.status as ClientPresenceStatus);
    client.user?.setActivity(bot.config.playing);

    // Prevent the disappearance of the activity status
    setInterval(() => {
        client.user?.setActivity(bot.config.playing);
    }, 10 * 60 * 1000); // 10 minutes


    if (bot.config.admin) bot.logger.emit('log', bot.shardId, `Set admin as user ID : ${bot.config.admin}`);
    bot.logger.emit('discord', bot.shardId, `>>> Logged in as ${client.user?.username}`);


    bot.logger.emit('log', bot.shardId, `${cst.color.green}*** Launched shard ${bot.shardId + 1} / ${client.shard?.count} ***${cst.color.white}`);
};