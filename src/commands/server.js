const embed = require('../embeds/embeds');


module.exports = {
    name: 'server',
    aliases: [],
    showHelp: false,
    description: 'Show currently active servers',
    usage: 'server',
    options: [],

    execute(client, message) {
        let serverlist = '';
        serverlist = client.guilds.cache
            .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
            .join('\n\n');

        return message.reply({ embeds: [embed.Embed_server(serverlist)], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        let serverlist = '';
        serverlist = client.guilds.cache
            .map(g => `Guild ID: ${g.id}\n Guild: ${g.name}\n Members: ${g.memberCount}`)
            .join('\n\n');

        return interaction.reply({ embeds: [embed.Embed_server(serverlist)], allowedMentions: { repliedUser: false } });
    },
};