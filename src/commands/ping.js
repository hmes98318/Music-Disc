const embed = require('../embeds/embeds');


module.exports = {
    name: 'ping',
    aliases: [],
    description: 'Get server ping',
    usage: 'ping',
    options: [],

    execute(client, message) {
        const botPing = `${Date.now() - message.createdTimestamp}ms`;
        message.reply({ embeds: [embed.Embed_ping(botPing, client.ws.ping)], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        const botPing = `${Date.now() - interaction.createdTimestamp}ms`;
        interaction.reply({ embeds: [embed.Embed_ping(botPing, client.ws.ping)], allowedMentions: { repliedUser: false } });
    },
};
