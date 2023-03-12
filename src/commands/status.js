const os = require('os');
const embed = require('../embeds/embeds');


module.exports = {
    name: 'status',
    aliases: ['usage'],
    description: '봇 상태를 표시합니다.',
    usage: 'status',
    options: [],

    async execute(client, message) { //uptime, os, node_v, djs_v, cpu, cpu_usage, ram, ping
        return message.reply({
            embeds: [embed.Embed_status(
                Uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                Usage(),
                Math.round((os.totalmem() - os.freemem()) / (1000 * 1000)) + 'MB',
                client.ws.ping
            )],
            allowedMentions: { repliedUser: false }
        });
    },

    async slashExecute(client, interaction) {
        return await interaction.reply({
            embeds: [embed.Embed_status(
                Uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                Usage(),
                Math.round((os.totalmem() - os.freemem()) / (1000 * 1000)) + 'MB',
                client.ws.ping
            )],
            allowedMentions: { repliedUser: false }
        });
    }
}




function Uptime(uptime) {

    let Today = new Date();
    let date1 = uptime.getTime();
    let date2 = Today.getTime();
    let total = (date2 - date1) / 1000;

    let day = parseInt(total / (24 * 60 * 60));
    let afterDay = total - day * 24 * 60 * 60;
    let hour = parseInt(afterDay / (60 * 60));
    let afterHour = total - day * 24 * 60 * 60 - hour * 60 * 60;
    let min = parseInt(afterHour / 60);
    let afterMin = Math.round(total - day * 24 * 60 * 60 - hour * 60 * 60 - min * 60);
    console.log(day + ' / ' + hour + ':' + min + ':' + afterMin);


    if (day >= 1)
        return day + '일 ' + hour + '시간'/* + min + 'Minute(s)' + afterMin*/;
    else
        return /*day + ' Days' +*/ hour + '시간 ' + min + '분' /*+ afterMin + 'Second(s)'*/;
}

function Usage() {
    console.log(os.loadavg());
    let avg_load = os.loadavg();
    return avg_load[0] + '%';
}