const embed = require('../embeds/embeds');

module.exports = {
    name: 'server',
    aliases: [],
    utilisation: '{prefix}server',

    execute(client, message) {
        let serverlist = ''
        client.guilds.cache.forEach((guild) => {
            serverlist = serverlist.concat(" - **" + guild.name + "** ID: " + guild.id + "\n")
        })
        return message.channel.send({ embeds: [embed.Embed_server(serverlist)] });
    },
};