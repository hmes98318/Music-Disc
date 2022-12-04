const embed = require('../embeds/embeds');

module.exports = {
    name: 'ping',
    aliases: [],
    description: 'Get server ping',

    execute(client, message) {
        message.reply({embeds:[embed.Embed_ping(client.ws.ping)],allowedMentions: { repliedUser: false }});
    },
};
