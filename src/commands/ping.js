const embed = require('../embeds/embeds');

module.exports = {
    name: 'ping',
    aliases: [],
    utilisation: '{prefix}ping',

    execute(client, message) {
        message.reply({embeds:[embed.Embed_ping(client.ws.ping)],allowedMentions: { repliedUser: false }});
    },
};
