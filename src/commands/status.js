const Discord = require('discord.js');
const os = require('os');
const exec = require('child_process').exec;
const embed = require('../embeds/embeds');

const uptime = new Date();

module.exports = {
    name: 'status',
    aliases: ['usage'],
    async execute(client, message) {//uptime, os, node_v, djs_v,cpu, cpu_usage, ram, ping
        return message.channel.send({ embeds: [embed.Embed_status(Uptime(uptime), await OSversion(), process.version, `v${Discord.version}`, os.cpus()[0].model, Usage(), Math.round((os.totalmem() - os.freemem()) / (1000 * 1000)) + 'MB', client.ws.ping)] });
    }
}




function Uptime(uptime) {

    let Today = new Date();
    let date1 = uptime.getTime();
    let date2 = Today.getTime();
    let total = (date2 - date1) / 1000;

    let day = parseInt(total / (24 * 60 * 60));//計算整數天數
    let afterDay = total - day * 24 * 60 * 60;//取得算出天數後剩餘的秒數
    let hour = parseInt(afterDay / (60 * 60));//計算整數小時數
    let afterHour = total - day * 24 * 60 * 60 - hour * 60 * 60;//取得算出小時數後剩餘的秒數
    let min = parseInt(afterHour / 60);//計算整數分
    let afterMin = Math.round(total - day * 24 * 60 * 60 - hour * 60 * 60 - min * 60);//取得算出分後剩餘的秒數
    console.log(day + ' / ' + hour + ':' + min + ':' + afterMin);

    return /*day + ' Days' +*/ hour + 'Hour(s) ' + min + 'Minute(s)' /*+ afterMin*/;
}

function Usage() {
    console.log(os.loadavg());
    let avg_load = os.loadavg();
    return avg_load[0] + '%';
}

function OSversion() {
    let platform = process.platform;

    if (platform === "win32")
        return os.type();

    else if (platform === "linux")
        return new Promise(function (resolve, reject) {
            exec('cat /etc/*release | grep -E ^PRETTY_NAME',
                (error, stdout, stderr) => {
                    let os_version = stdout.split('"')[1];
                    //console.log(`${stdout}`);
                    //console.log(`${stderr}`);

                    if (error !== null) {
                        reject(error);
                    }
                    resolve(os_version);
                });
        });

    else
        return process.platform;
}
