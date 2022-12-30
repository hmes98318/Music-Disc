const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embed = require('../embeds/embeds');


module.exports = {
    name: 'nowplaying',
    aliases: ['np'],
    description: 'Show now playing song',
    usage: 'nowplaying',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        const track = queue.current;

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : track.duration;
        let description = `Author : **${track.author}**\nDuration **${trackDuration}**`;


        let saveButton = new ButtonBuilder();
        saveButton.setCustomId('Save Song');
        saveButton.setLabel('Save Song');
        saveButton.setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(saveButton);

        return message.channel.send({ embeds: [embed.Embed_save(track.title, track.url, track.thumbnail, description)], components: [row] });
    },

    slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        const track = queue.current;

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Forever' ? 'Endless (Live)' : track.duration;
        let description = `Author : **${track.author}**\nDuration **${trackDuration}**`;


        let saveButton = new ButtonBuilder();
        saveButton.setCustomId('Save Song');
        saveButton.setLabel('Save Song');
        saveButton.setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(saveButton);

        return interaction.reply({ embeds: [embed.Embed_save(track.title, track.url, track.thumbnail, description)], components: [row] });
    },
};