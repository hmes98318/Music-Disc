const embed = require('../embeds/embeds');

module.exports = {
    name: 'save',
    aliases: [],
    description: 'Save the current song',
    voiceChannel: true,

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing!. `, allowedMentions: { repliedUser: false } });


        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : queue.current.duration;
        let description = `Author : **${queue.current.author}**\nDuration **${trackDuration}**`;

        message.author.send({ embeds: [embed.Embed_save(queue.current.title, queue.current.url, queue.current.thumbnail, description)] })
            //message.author.send(`Registered track: **${queue.current.title}** | ${queue.current.author}, Saved server: **${message.guild.name}** ✅`)
            .then(() => {
                message.react('👍');
            }).catch(e => {
                console.log(e);
                message.react('❌');
            });
    },
};