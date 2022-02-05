const embed = require('../embeds/embeds.js');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    utilisation: '{prefix}queue',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

 
        if (!queue || !queue.playing) return message.channel.send(`❌ | There is no music currently playing.`);

        if (!queue.tracks[0]) return message.channel.send(`❌ | No music in queue after current.`);


        let queueMsg = `Now Playing : ${queue.tracks[0].title}\n\n`;
        if (queue.tracks.length > 10) {
          for (var i = 1; i <= 10; i++) {
            queueMsg += `${i}. ${queue.tracks[i].title}\n`;
          }
          queueMsg += `and ${queue.tracks.length - 10} other songs`;
        }
        else {
          for (var i = 1; i < queue.tracks.length; i++) {
            queueMsg += `${i}. ${queue.tracks[i].title}\n`;
          }
        }
        return message.channel.send({ embeds: [embed.Embed_queue("Queue List", queueMsg)] });
    },
};