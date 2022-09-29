module.exports = {
    name: 'pause',
    aliases: [],
    utilisation: '{prefix}pause',
    voiceChannel: true,

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`${message.author}, There is no music currently playing!. ❌`);

        const success = queue.setPaused(true);

        return success ? message.react('⏸️') : message.channel.send(`❌ | Something went wrong.`);
    },
};