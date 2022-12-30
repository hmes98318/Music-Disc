const os = require('os');
const { exec } = require('child_process');
const Discord = require('discord.js');
const package = require('../../package.json');


const color = { white: '\x1B[0m', cyan: '\x1B[36m' };


module.exports = async (client) => {
    client.status = {
        uptime: new Date(),
        os_version: await OSversion(),
        node_version: process.version,
        discord_version: `v${Discord.version}`,
        bot_version: `v${package.version}`,
        cpu: `${os.cpus()[0].model}`
    };


    const release = {
        bot: `${client.config.name}: ${color.cyan}${client.status.bot_version}${color.white}`,
        nodejs: `Node.js: ${color.cyan}${client.status.node_version}${color.white}`,
        djs: `Discord.js: ${color.cyan}${client.status.discord_version}${color.white}`
    }
    console.log(`+-----------------------+`);
    console.log(`| ${release.bot.padEnd(30, ' ')} |`);
    console.log(`| ${release.nodejs.padEnd(30, ' ')} |`);
    console.log(`| ${release.djs.padEnd(30, ' ')} |`);
    console.log(`+-----------------------+`);


    client.application.commands.set(client.commands.map(cmd => {
        return {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options
        }
    }));

    client.user.setActivity(client.config.playing);
    console.log(`>>> Logged in as ${client.user.username}`);
};




function OSversion() {
    let platform = process.platform;

    if (platform === "win32")
        return os.type();

    else if (platform === "linux")
        return new Promise(function (resolve, reject) {
            exec('cat /etc/*release | grep -E ^PRETTY_NAME',
                (error, stdout, stderr) => {
                    if (error !== null) reject(error);

                    let os_version = stdout.split('"')[1];
                    resolve(os_version);
                });
        });

    else
        return process.platform;
}