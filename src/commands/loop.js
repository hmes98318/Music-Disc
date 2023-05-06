module.exports = {
    name: 'loop',
    aliases: ['lp'],
    description: 'Turns the music loop mode on or off',
    usage: 'loop <ap/all/one/off>',
    voiceChannel: true,
    options: [
        {
            name: "mode",
            description: "The loop mode",
            type: 3,
            required: true,
            choices: [
                {
                    name: "Off",
                    value: "off"
                },
                {
                    name: "All",
                    value: "all"
                },
                {
                    name: "One",
                    value: "one"
                },
                {
                    name: "Autoplay",
                    value: "ap"
                }
            ]
        }
    ],

    execute(client, message, args) {
        const queue = client.player.nodes.get(message.guild.id);
        const prefix = client.config.prefix;

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        let mode = null;
        const methods = ['Off', 'Single', 'All', 'Autoplay'];

        if (!args[0])
            return message.reply({ content: `❌ | ${prefix}loop <ap/all/one/off>`, allowedMentions: { repliedUser: false } });

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
            case 'ap' || 'autoplay':
                mode = 3;
                break;
            default:
                return message.reply({ content: `❌ | ${prefix}loop <ap/all/one/off>`, allowedMentions: { repliedUser: false } });
        }
        queue.setRepeatMode(mode);

        message.react('👍');
        return message.reply({ content: `Set loop to \`${methods[mode]}\``, allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });


        const methods = {
            off: 0,
            one: 1,
            all: 2,
            ap: 3
        }
        const names = {
            off: "Off",
            one: "Single",
            all: "All",
            ap: "Autoplay"
        }

        queue.setRepeatMode(methods[interaction.options.getString("mode")]);

        return interaction.reply({ content: `Set loop to \`${names[interaction.options.getString("mode")]}\``, allowedMentions: { repliedUser: false } });
    },
};