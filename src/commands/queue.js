const embed = require('../embeds/embeds');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    utilisation: '{prefix}queue',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

 
        if (!queue || !queue.playing) return message.channel.send(`❌ | There is no music currently playing.`);

        if (!queue.tracks[0]) return message.channel.send(`❌ | No music in queue after current.`);


        let nowplay = `Now Playing : ${queue.current.title}\n\n`;
        let queueMsg = '';
        if (queue.tracks.length > 9) {
          for (var i = 0; i <= 9; i++) {
            queueMsg += `${i+1}. ${queue.tracks[i].title}\n`;
          }
          queueMsg += `and ${queue.tracks.length - 9} other songs`;
        }
        else {
          for (var i = 0; i < queue.tracks.length; i++) {
            queueMsg += `${i+1}. ${queue.tracks[i].title}\n`;
          }
        }

        let loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'One') : 'Off';
        return message.channel.send({ embeds: [embed.Embed_queue("Queue List", nowplay, queueMsg, loopStatus)] });
    },
};