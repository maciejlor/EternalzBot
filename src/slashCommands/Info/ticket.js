// Ticket System with Discord Regular Components
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a ticket system panel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Ticket panel title')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Ticket panel description')
        .setRequired(false)),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    try {
      console.log('[TICKET] Command started');
      
      // Defer reply immediately to prevent timeout
      await interaction.deferReply();
      
      // Check permissions
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionsBitField.Flags.ManageChannels);
      
      if (!hasPermission) {
        return interaction.editReply({
          content: '❌ **Yetkisiz Erişim**\nBu komutu kullanmak için **Kanalları Yönet** iznine sahip olmanız gerekir.',
        });
      }

      // Get options
      const title = interaction.options.getString('title') || '🎫 Support System';
      const description = interaction.options.getString('description') || 'Click one of the buttons below to create a support ticket.';

      // Create main embed
      const ticketEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setTitle(title)
        .setDescription(description)
        .addFields([
          { 
            name: '🛠️ General Support', 
            value: 'General questions and technical support', 
            inline: true 
          },
          { 
            name: '🐛 Bug Report', 
            value: 'Report bugs and issues you encounter', 
            inline: true 
          },
          { 
            name: '💡 Suggestion', 
            value: 'Share your suggestions and ideas', 
            inline: true 
          },
          { 
            name: '🤝 Partnership', 
            value: 'Business collaboration and partnership offers', 
            inline: true 
          },
          {
            name: '📋 Important Information',
            value: '• Please only open tickets for genuine needs\n' +
                   '• Opening unnecessary tickets may result in penalties\n' +
                   '• Our support team will respond as soon as possible\n' +
                   '• Be patient after opening a ticket and do not spam',
            inline: false
          }
        ])
        .setTimestamp()
        .setFooter({ text: 'Support System', iconURL: client.user.displayAvatarURL() });

      // Create buttons
      const generalButton = new ButtonBuilder()
        .setCustomId('ticket_general')
        .setLabel('General Support')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🛠️');

      const bugButton = new ButtonBuilder()
        .setCustomId('ticket_bug')
        .setLabel('Report Bug')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🐛');

      const suggestionButton = new ButtonBuilder()
        .setCustomId('ticket_suggestion')
        .setLabel('Send Suggestion')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💡');

      const partnershipButton = new ButtonBuilder()
        .setCustomId('ticket_partnership')
        .setLabel('Partnership')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🤝');

      // Create action rows (max 5 buttons per row)
      const row1 = new ActionRowBuilder()
        .addComponents(generalButton, bugButton);

      const row2 = new ActionRowBuilder()
        .addComponents(suggestionButton, partnershipButton);

      await interaction.editReply({
        embeds: [ticketEmbed],
        components: [row1, row2]
      });

      console.log('[TICKET] Panel created successfully');

    } catch (error) {
      console.error('[TICKET] Error:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: `❌ Error: ${error.message}`,
          });
        } else {
          await interaction.reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('[TICKET] Reply error:', replyError);
      }
    }
  },
};

