module.exports = {
    name: 'skip',
    aliases: ['s'],
    utilisation: '{prefix}skip',
    voiceChannel: true,

    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.channel.send(`❌ | There is no music currently playing.`);


        if (queue.repeatMode === 1) {
            queue.setRepeatMode(0);
            queue.skip();
            await wait(500);
            queue.setRepeatMode(1);
        }
        else
            queue.skip();

        return message.react('👍');
    },
};




function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
};