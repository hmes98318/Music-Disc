const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const embed = require('../embeds/embeds');


module.exports = async (client, int) => {

    if (int.isButton()) {
        if (!int.member.voice.channel)
            return int.reply({ content: `❌ | You are not connected to an audio channel.`, ephemeral: true, components: [] });

        if (int.guild.members.me.voice.channel && int.member.voice.channelId !== int.guild.members.me.voice.channelId)
            return int.reply({ content: `❌ | You are not on the same audio channel as me.`, ephemeral: true, components: [] });


        const queue = client.player.nodes.get(int.guildId);

        if (!queue || !queue.isPlaying())
            return int.reply({ content: `❌ | There is no music currently playing.`, ephemeral: true, components: [] });


        let track = queue.currentTrack;
        const timestamp = queue.node.getTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : track.duration;
        let description = `Author : **${track.author}**\nDuration **${trackDuration}**`;

        switch (int.customId) {
            case 'Save Song': {
                int.member.send({ embeds: [embed.Embed_save(track.title, track.url, track.thumbnail, description)] })
                    .then(() => {
                        return int.reply({ content: `✅ | I sent you the name of the music in a private message.`, ephemeral: true, components: [] });
                    })
                    .catch(error => {
                        console.log('error: ' + error);
                        return int.reply({ content: `❌ | I can't send you a private message.`, ephemeral: true, components: [] });
                    });
            } break;

            case 'Playing-PlayPause': {
                let playing = !queue.node.isPaused();

                if (playing) queue.node.pause();
                else queue.node.resume();

                const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(playing ? '►' : '❚❚').setStyle(playing ? ButtonStyle.Success : ButtonStyle.Secondary);
                const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel('►❚').setStyle(ButtonStyle.Secondary);
                const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel('🔁').setStyle(ButtonStyle.Secondary);
                const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel('◼').setStyle(ButtonStyle.Danger);
                const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel('🔀').setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

                await int.update({ components: [row] });
            } break;

            case 'Playing-Skip': {

                if (queue.repeatMode === 1) {
                    queue.setRepeatMode(0);
                    queue.node.skip();
                    await wait(500);
                    queue.setRepeatMode(1);
                }
                else {
                    queue.node.skip();
                    await wait(500);
                }

                let playing = queue.node.isPaused();
                track = queue.currentTrack;

                const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(playing ? '►' : '❚❚').setStyle(playing ? ButtonStyle.Success : ButtonStyle.Secondary);
                const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel('►❚').setStyle(ButtonStyle.Secondary);
                const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel('🔁').setStyle(ButtonStyle.Secondary);
                const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel('◼').setStyle(ButtonStyle.Danger);
                const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel('🔀').setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

                await int.update({ components: [row] });
            } break;

            case 'Playing-Loop': {
                const methods = ['Off', 'Single', 'All'];
                let mode = 0;

                const select = new StringSelectMenuBuilder()
                    .setCustomId("Playing-Loop Select")
                    .setPlaceholder("Select the loop mode")
                    .setOptions(methods.map(x => {
                        return {
                            label: x,
                            description: x,
                            value: x
                        }
                    }))

                const row = new ActionRowBuilder().addComponents(select);
                let msg = await int.reply({ content: `Select a song loop mode.`, ephemeral: true, components: [row] });

                const collector = msg.createMessageComponentCollector({
                    time: 20000, // 20s
                    filter: i => i.user.id === int.user.id
                });

                collector.on("collect", async i => {
                    if (i.customId != "Playing-Loop Select") return;

                    switch (i.values[0]) {
                        case 'Off':
                            mode = 0;
                            break;
                        case 'Single':
                            mode = 1;
                            break;
                        case 'All':
                            mode = 2;
                            break;
                    }
                    queue.setRepeatMode(mode);

                    await i.deferUpdate();
                    await int.editReply({ content: `✅ | Set loop to \`${methods[mode]}\`.`, ephemeral: true, components: [] });


                    let playing = queue.node.isPaused();
                    track = queue.currentTrack;

                    const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(playing ? '►' : '❚❚').setStyle(playing ? ButtonStyle.Success : ButtonStyle.Secondary);
                    const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel('►❚').setStyle(ButtonStyle.Secondary);
                    const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel('🔁').setStyle(ButtonStyle.Secondary);
                    const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel('◼').setStyle(ButtonStyle.Danger);
                    const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel('🔀').setStyle(ButtonStyle.Secondary);
                    const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

                    return await queue.dashboard.edit({ embeds: [embed.Embed_play("Playing", track.title, track.url, track.duration, track.thumbnail, settings(queue))], components: [row] });
                });

                collector.on("end", (collected, reason) => {
                    if (reason == "time" && collected.size == 0) {
                        if (!queue?.deleted && !queue.isPlaying()) queue?.delete();
                        return int.editReply({ content: "❌ | Time expired.", ephemeral: true, components: [] });
                    }
                });
            } break;

            case 'Playing-Stop': {
                if (!queue.deleted)
                    queue.delete();

                await int.reply({ content: '✅ | Bot leave.', ephemeral: true, components: [] });
            } break;

            case 'Playing-Shuffle': {
                queue.tracks.shuffle();
                await int.reply({ content: '✅ | Music shuffled.', ephemeral: true, components: [] });
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


const settings = (queue, song) =>
    `**Volume**: \`${queue.node.volume}%\` | **Loop**: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'Single') : 'Off'}\``;


const wait = (ms) => {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
};