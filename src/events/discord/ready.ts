import os from 'os';

import { Client, version as dcVersion } from 'discord.js';
import { VERSION as sharkVersion } from 'lavashark';

import { version as botVersion } from '../../../package.json';
import { getOSVersion } from '../../utils/functions/getOSVersion';
import { cst } from '../../utils/constants';


module.exports = async (client: Client) => {
    client.info = {
        uptime: new Date(),
        os_version: await getOSVersion(),
        bot_version: `v${botVersion}`,
        node_version: process.version,
        dc_version: `v${dcVersion}`,
        shark_version: `v${sharkVersion}`,
        cpu: `${os.cpus()[0].model}`
    };


    const release = {
        bot: `${client.config.name}: ${cst.color.cyan}${client.info.bot_version}${cst.color.white}`,
        nodejs: `Node.js:    ${cst.color.cyan}${client.info.node_version}${cst.color.white}`,
        djs: `Discord.js: ${cst.color.cyan}${client.info.dc_version}${cst.color.white}`,
        shark: `LavaShark:  ${cst.color.cyan}${client.info.shark_version}${cst.color.white}`,
    }

    console.log(`+-----------------------+`);
    console.log(`| ${release.bot.padEnd(30, ' ')} |`);
    console.log(`| ${release.nodejs.padEnd(30, ' ')} |`);
    console.log(`| ${release.djs.padEnd(30, ' ')} |`);
    console.log(`| ${release.shark.padEnd(30, ' ')} |`);
    console.log(`+-----------------------+`);


    client.application?.commands.set(client.commands.map(cmd => {
        return {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options
        }
    }));

    client.lavashark.start(String(client.user?.id));
    client.user?.setActivity(client.config.playing);
    console.log(`>>> Logged in as ${client.user?.username}`);
};