const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(true)),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (!member.kickable) {
      return interaction.reply({ content: 'I cannot kick this user!', ephemeral: true });
    }

    // Kick the member
    await member.kick(reason);

    // Create an embed message
    const embed = new EmbedBuilder()
      .setTitle('Member Kicked')
      .setColor('RED')
      .addFields(
        { name: 'Kicked Member', value: `${member.user.tag}`, inline: true },
        { name: 'Moderator', value: `${moderator.tag}`, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
      .setTimestamp();

    // Send the embed to the current channel
    return interaction.reply({ embeds: [embed] });
  },
};
