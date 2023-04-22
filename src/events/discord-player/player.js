const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const embed = require(`${__dirname}/../../embeds/embeds`);
const { label } = require(`${__dirname}/../../utils/constants`);
const { settings } = require(`${__dirname}/../../utils/player/settings`);
const { finishPlaying } = require(`${__dirname}/../../utils/player/finishPlaying`);


const registerPlayerEvents = (player) => {

    player.events.on('connection', async (queue) => {
        const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(label.pause).setStyle(ButtonStyle.Secondary);
        const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel(label.skip).setStyle(ButtonStyle.Secondary);
        const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel(label.loop).setStyle(ButtonStyle.Secondary);
        const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel(label.stop).setStyle(ButtonStyle.Danger);
        const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel(label.suuffle).setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

        queue.dashboard = await queue.metadata.channel.send({ embeds: [embed.Embed_connect()], components: [row] });
        return;
    });

    player.events.on('playerStart', async (queue, track) => {
        let playing = queue.node.isPaused();

        const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(playing ? label.play : label.pause).setStyle(ButtonStyle.Secondary);
        const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel(label.skip).setStyle(ButtonStyle.Secondary);
        const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel(label.loop).setStyle(ButtonStyle.Secondary);
        const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel(label.stop).setStyle(ButtonStyle.Danger);
        const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel(label.suuffle).setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

        return await queue.dashboard.edit({ embeds: [embed.Embed_play("Playing", track.title, track.url, track.duration, track.thumbnail, settings(queue))], components: [row] });
    });

    player.events.on('audioTrackAdd', async (queue, track) => {
        if (queue.isPlaying()) {
            await queue.metadata.channel.send({ embeds: [embed.Embed_play("Added", track.title, track.url, track.duration, track.thumbnail, settings(queue))] });


            let playing = queue.node.isPaused();

            const playPauseButton = new ButtonBuilder().setCustomId('Playing-PlayPause').setLabel(playing ? label.play : label.pause).setStyle(ButtonStyle.Secondary);
            const skipButton = new ButtonBuilder().setCustomId('Playing-Skip').setLabel(label.skip).setStyle(ButtonStyle.Secondary);
            const loopButton = new ButtonBuilder().setCustomId('Playing-Loop').setLabel(label.loop).setStyle(ButtonStyle.Secondary);
            const stopButton = new ButtonBuilder().setCustomId('Playing-Stop').setLabel(label.stop).setStyle(ButtonStyle.Danger);
            const shuffleButton = new ButtonBuilder().setCustomId('Playing-Shuffle').setLabel(label.suuffle).setStyle(ButtonStyle.Secondary);
            const row = new ActionRowBuilder().addComponents(playPauseButton, skipButton, loopButton, stopButton, shuffleButton);

            const cur = queue.currentTrack;
            queue.dashboard = await queue.metadata.channel.send({ embeds: [embed.Embed_play("Playing", cur.title, cur.url, cur.duration, cur.thumbnail, settings(queue))], components: [row] });
            return;
        }
    });

    player.events.on('playerError', (queue, error) => {
        console.log(`I'm having trouble connecting => ${error.message}`);
    });

    player.events.on('error', (queue, error) => {
        console.log(`There was a problem with the song queue => ${error.message}`);
    });

    player.events.on('emptyChannel', (queue) => {
        if (!client.config.autoLeave) queue.node.stop();

        finishPlaying(queue);
    });

    player.events.on('disconnect', (queue) => {
        finishPlaying(queue);
    });

    player.events.on('emptyQueue', (queue) => {
        finishPlaying(queue);
    });
}
module.exports = registerPlayerEvents;