const embed = require('../embeds/embeds');
const { uptime } = require('../utils/functions/uptime');
const { usage } = require('../utils/functions/usage');


module.exports = {
    name: 'status',
    aliases: ['usage'],
    description: 'Show the bot status',
    usage: 'status',
    options: [],

    async execute(client, message) { //uptime, os, node_v, djs_v, cpu, cpu_usage, ram, ping
        return message.reply({
            embeds: [embed.Embed_status(
                uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                usage.cpu(),
                usage.ram(),
                client.ws.ping
            )],
            allowedMentions: { repliedUser: false }
        });
    },

    async slashExecute(client, interaction) {
        return await interaction.reply({
            embeds: [embed.Embed_status(
                uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                usage.cpu(),
                usage.ram(),
                client.ws.ping
            )],
            allowedMentions: { repliedUser: false }
        });
    }
};