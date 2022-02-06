const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const embed = require('../embeds/embeds.js');

module.exports = {
    name: 'nowplaying',
    aliases: ['np'],
    utilisation: '{prefix}nowplaying',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`❌ | There is no music currently playing.`);

        const track = queue.current;

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : track.duration;
        let description = `Author : **${track.author}**\nDuration **${trackDuration}**`;


        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('Save Song')
                    .setLabel('Save Song')
                    .setStyle('SUCCESS'),
            );






        return message.channel.send({ embeds: [embed.Embed_save(track.title, track.url, track.thumbnail, description)], components: [row] });

    },
};