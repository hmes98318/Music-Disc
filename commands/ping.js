const embed = require('../embeds/embeds.js');

module.exports = {
    name: 'ping',
    aliases: [],
    utilisation: '{prefix}ping',

    execute(client, message) {
        message.channel.send({embeds:[embed.Embed_ping(client.ws.ping)]});
    },
};
