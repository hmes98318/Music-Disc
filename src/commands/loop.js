const prefix = require('../../config.json').prefix;

module.exports = {
    name: 'loop',
    aliases: ['lp'],
    description: 'Turns the music loop mode on or off',
    voiceChannel: true,

    execute(client, message, args) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        let mode = null;
        const methods = ['Off', 'Single', 'All'];

        if (!args[0])
            return message.reply({ content: `❌ | ${prefix}loop [all/one/off]`, allowedMentions: { repliedUser: false } });

        switch (args[0].toLowerCase()) {
            case 'off':
                mode = 0;
                break;
            case 'one' || 'single':
                mode = 1;
                break;
            case 'all' || 'queue':
                mode = 2;
                break;
            default:
                return message.reply({ content: `❌ | ${prefix}loop [all/one/off]`, allowedMentions: { repliedUser: false } });
        }
        queue.setRepeatMode(mode);

        message.react('👍');
        return message.reply({ content: `Set loop to \`${methods[mode]}\``, allowedMentions: { repliedUser: false } });
    },
};
