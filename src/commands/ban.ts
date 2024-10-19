module.exports = {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('The member to ban')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for the ban')
          .setRequired(true)),
  
    async execute(interaction) {
      const member = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const moderator = interaction.user;
  
      if (!member.bannable) {
        return interaction.reply({ content: 'I cannot ban this user!', ephemeral: true });
      }
  
      // Ban the member
      await member.ban({ reason });
  
      // Create an embed message
      const embed = new EmbedBuilder()
        .setTitle('Member Banned')
        .setColor('RED')
        .addFields(
          { name: 'Banned Member', value: `${member.user.tag}`, inline: true },
          { name: 'Moderator', value: `${moderator.tag}`, inline: true },
          { name: 'Reason', value: reason, inline: true }
        )
        .setTimestamp();
  
      // Send the embed to the current channel
      return interaction.reply({ embeds: [embed] });
    },
  };
  