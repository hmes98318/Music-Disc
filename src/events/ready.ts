import os from 'os';
import { Client, version as dcVersion } from 'discord.js';

import { version } from '../../package.json';
import { getOSVersion } from '../utils/functions/getOSVersion';
import { cst } from '../utils/constants';


module.exports = async (client: Client) => {
    client.status = {
        uptime: new Date(),
        os_version: await getOSVersion(),
        node_version: process.version,
        dc_version: `v${dcVersion}`,
        bot_version: `v${version}`,
        cpu: `${os.cpus()[0].model}`
    };


    const release = {
        bot: `${client.config.name}: ${cst.color.cyan}${client.status.bot_version}${cst.color.white}`,
        nodejs: `Node.js: ${cst.color.cyan}${client.status.node_version}${cst.color.white}`,
        djs: `Discord.js: ${cst.color.cyan}${client.status.dc_version}${cst.color.white}`
    }
    console.log(`+-----------------------+`);
    console.log(`| ${release.bot.padEnd(30, ' ')} |`);
    console.log(`| ${release.nodejs.padEnd(30, ' ')} |`);
    console.log(`| ${release.djs.padEnd(30, ' ')} |`);
    console.log(`+-----------------------+`);


    client.application?.commands.set(client.commands.map(cmd => {
        return {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options
        }
    }));

    client.user?.setActivity(client.config.playing);
    console.log(`>>> Logged in as ${client.user?.username}`);
};