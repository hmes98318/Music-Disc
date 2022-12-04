const embed = require('../embeds/embeds');

module.exports = {
    name: 'server',
    aliases: [],
    description: 'Show currently active servers',

    execute(client, message) {
        let serverlist = ''
        client.guilds.cache.forEach((guild) => {
            serverlist = serverlist.concat(" - **" + guild.name + "** ID: " + guild.id + "\n")
        })
        return message.reply({ embeds: [embed.Embed_server(serverlist)], allowedMentions: { repliedUser: false } });
    },
};