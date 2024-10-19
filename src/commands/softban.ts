module.exports = {
    data: new SlashCommandBuilder()
      .setName('softban')
      .setDescription('Softban (ban and immediately unban) a member')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('The member to softban')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for the softban')
          .setRequired(true)),
  
    async execute(interaction) {
      const member = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const moderator = interaction.user;
  
      if (!member.bannable) {
        return interaction.reply({ content: 'I cannot softban this user!', ephemeral: true });
      }
  
      // Softban: ban and immediately unban
      await member.ban({ reason });
      await interaction.guild.members.unban(member.id);
  
      // Create an embed message
      const embed = new EmbedBuilder()
        .setTitle('Member Softbanned')
        .setColor('RED')
        .addFields(
          { name: 'Softbanned Member', value: `${member.user.tag}`, inline: true },
          { name: 'Moderator', value: `${moderator.tag}`, inline: true },
          { name: 'Reason', value: reason, inline: true }
        )
        .setTimestamp();
  
      // Send the embed to the current channel
      return interaction.reply({ embeds: [embed] });
    },
  };
  