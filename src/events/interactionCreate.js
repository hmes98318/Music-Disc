const embed = require('../embeds/embeds');


module.exports = (client, int) => {

    if (int.isButton()) {
        const queue = client.player.getQueue(int.guildId);

        if (!queue || !queue.playing)
            return int.reply({ content: `❌ | There is no music currently playing.`, ephemeral: true, components: [] });


        const track = queue.current;
        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : track.duration;
        let description = `Author : **${track.author}**\nDuration **${trackDuration}**`;


        switch (int.customId) {
            case 'Save Song': {

                if (!queue || !queue.playing)
                    return int.reply({ content: `❌ | No music currently playing.`, ephemeral: true, components: [] });


                int.member.send({ embeds: [embed.Embed_save(track.title, track.url, track.thumbnail, description)] })
                    .then(() => {
                        return int.reply({ content: `✅ | I sent you the name of the music in a private message.`, ephemeral: true, components: [] });
                    })
                    .catch(error => {
                        console.log('error: ' + error);
                        return int.reply({ content: `❌ | I can't send you a private message.`, ephemeral: true, components: [] });
                    });
            } break;
        }
    }
    else {
        if (!int.isCommand() || !int.inGuild() || int.member.user.bot) return;


        const cmd = client.commands.get(int.commandName);
        if (cmd) {
            console.log(`(\x1B[2m${int.member.guild.name}\x1B[0m) ${int.user.username} : /${int.commandName}`);
            cmd.slashExecute(client, int);
        }
    }
};
