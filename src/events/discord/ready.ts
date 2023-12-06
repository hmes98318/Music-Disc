import os from 'os';

import {
    Client,
    ClientPresenceStatus,
    version as dcVersion
} from 'discord.js';
import { VERSION as sharkVersion } from 'lavashark';

import { version as botVersion } from '../../../package.json';
import { getOSVersion } from '../../utils/functions/getOSVersion';
import { cst } from '../../utils/constants';

import type { Bot } from "../../@types";


export default async (bot: Bot, client: Client) => {
    bot.sysInfo = {
        startupTime: new Date(),
        os_version: await getOSVersion(),
        bot_version: `v${botVersion}`,
        node_version: process.version,
        dc_version: `v${dcVersion}`,
        shark_version: `v${sharkVersion}`,
        cpu: `${os.cpus()[0].model}`
    };


    const release = {
        bot: `${bot.config.name}: ${cst.color.cyan}${bot.sysInfo.bot_version}${cst.color.white}`,
        nodejs: `Node.js:    ${cst.color.cyan}${bot.sysInfo.node_version}${cst.color.white}`,
        djs: `Discord.js: ${cst.color.cyan}${bot.sysInfo.dc_version}${cst.color.white}`,
        shark: `LavaShark:  ${cst.color.cyan}${bot.sysInfo.shark_version}${cst.color.white}`,
    };

    bot.logger.emit('log', `+-----------------------+`);
    bot.logger.emit('log', `| ${release.bot.padEnd(30, ' ')} |`);
    bot.logger.emit('log', `| ${release.nodejs.padEnd(30, ' ')} |`);
    bot.logger.emit('log', `| ${release.djs.padEnd(30, ' ')} |`);
    bot.logger.emit('log', `| ${release.shark.padEnd(30, ' ')} |`);
    bot.logger.emit('log', `+-----------------------+`);


    client.application?.commands.set(client.commands.map(cmd => {
        return {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options
        };
    }));

    client.lavashark.start(String(client.user?.id));
    client.user?.setStatus(bot.config.status as ClientPresenceStatus);
    client.user?.setActivity(bot.config.playing);
    // Prevent the disappearance of the activity status
    setInterval(() => {
        client.user?.setActivity(bot.config.playing);
    }, 10 * 60 * 1000); // 10 minutes


    if (bot.config.admin) bot.logger.emit('log', `Set admin as user ID : ${bot.config.admin}`);
    bot.logger.emit('discord', `>>> Logged in as ${client.user?.username}`);
};