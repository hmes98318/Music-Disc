const embed = require('../embeds/embeds');
const { uptime } = require('../utils/functions/uptime');
const { usage } = require('../utils/functions/usage');


module.exports = {
    name: 'status',
    aliases: ['usage'],
    description: 'Show the bot status',
    usage: 'status',
    options: [],

    async execute(client, message) { //uptime, os, node_v, djs_v, cpu, cpu_usage, ram, ping, serverCount
        const botPing = `${Date.now() - message.createdTimestamp}ms`;
        const load = await usage.cpu();
        const memory = usage.ram();
        const heap = usage.heap();

        return message.reply({
            embeds: [embed.Embed_status(
                uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                (`${load.percent}  \`${load.detail}\``),
                (`${memory.percent}  \`${memory.detail}\``),
                (`${heap.percent}  \`${heap.detail}\``),
                { bot: (botPing), api: client.ws.ping },
                client.guilds.cache.size
            )],
            allowedMentions: { repliedUser: false }
        });
    },

    async slashExecute(client, interaction) {
        const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
        const load = await usage.cpu();
        const memory = usage.ram();
        const heap = usage.heap();

        return await interaction.reply({
            embeds: [embed.Embed_status(
                uptime(client.status.uptime),
                client.status.os_version,
                client.status.node_version,
                client.status.discord_version,
                client.status.cpu,
                (`${load.percent}  \`${load.detail}\``),
                (`${memory.percent}  \`${memory.detail}\``),
                (`${heap.percent}  \`${heap.detail}\``),
                { bot: (botPing), api: client.ws.ping },
                client.guilds.cache.size
            )],
            allowedMentions: { repliedUser: false }
        });
    }
};