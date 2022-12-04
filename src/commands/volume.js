module.exports = {
    name: 'volume',
    aliases: ['v'],
    description: `Configure bot volume`,
    voiceChannel: true,

    async execute(client, message, args) {
        const maxVolume = client.config.maxVolume;
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        await message.react('👍');
        const vol = parseInt(args[0]);

        if (!vol)
            return message.reply({ content: `Current volume: **${queue.volume}** 🔊\n**To change the volume, with \`1\` to \`${maxVolume}\` Type a number between.**`, allowedMentions: { repliedUser: false } });

        if (queue.volume === vol)
            return message.reply({ content: `❌ | The volume you want to change is already the current volume.`, allowedMentions: { repliedUser: false } });

        if (vol < 0 || vol > maxVolume)
            return message.reply({ content: `❌ | **Type a number from \`1\` to \`${maxVolume}\` to change the volume .**`, allowedMentions: { repliedUser: false } });

        const success = queue.setVolume(vol);
        const replymsg = success ? `🔊 **${vol}**/**${maxVolume}**%` : `❌ | Something went wrong.`;
        return message.reply({ content: replymsg, allowedMentions: { repliedUser: false } });
    },
};