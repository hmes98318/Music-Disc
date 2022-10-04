const Discord = require('discord.js');
const os = require('os');
const { exec } = require('child_process');


module.exports = async (client) => {
    console.log(`>>> Logged in as ${client.user.username}`);

    client.user.setActivity(client.config.playing);

    client.status = {
        uptime: new Date(),
        os_version: await OSversion(),
        node_version: process.version,
        discord_version: `v${Discord.version}`
    };
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