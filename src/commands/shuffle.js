module.exports = {
    name: 'shuffle',
    aliases: ['random'],
    utilisation: '{prefix}shuffle',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`${message.author}, There is no music currently playing!. ❌`);

        const success = queue.shuffle();

        return success ? message.react('👍') : message.channel.send(`❌ | Something went wrong.`);
    },
};