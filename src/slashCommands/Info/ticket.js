// Ticket System with Discord V2 Components
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { 
  TextDisplayBuilder, 
  ContainerBuilder, 
  SeparatorBuilder, 
  MessageFlags, 
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SectionBuilder,
  ThumbnailBuilder
} = require('discord.js');

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

      // Create header section with icon
      const headerText = new TextDisplayBuilder()
        .setContent(`# ${title}\n\n${description}`);

      // Create ticket types sections
      const generalSupportSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**🛠️ General Support**'),
          new TextDisplayBuilder().setContent('General questions and technical support')
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_general')
            .setLabel('General Support')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛠️')
        );

      const bugReportSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**🐛 Bug Report**'),
          new TextDisplayBuilder().setContent('Report bugs and issues you encounter')
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_bug')
            .setLabel('Report Bug')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🐛')
        );

      const suggestionSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**💡 Suggestion**'),
          new TextDisplayBuilder().setContent('Share your suggestions and ideas')
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_suggestion')
            .setLabel('Send Suggestion')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💡')
        );

      const partnershipSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**🤝 Partnership**'),
          new TextDisplayBuilder().setContent('Business collaboration and partnership offers')
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_partnership')
            .setLabel('Partnership')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🤝')
        );

      // Create separators
      const separator = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small);

      // Create info section
      const infoText = new TextDisplayBuilder()
        .setContent(
          '**📋 Important Information:**\n' +
          '• Please only open tickets for genuine needs\n' +
          '• Opening unnecessary tickets may result in penalties\n' +
          '• Our support team will respond as soon as possible\n' +
          '• Be patient after opening a ticket and do not spam'
        );

      // Create main container
      const container = new ContainerBuilder()
        .setAccentColor(0x5b5078)
        .addTextDisplayComponents(headerText)
        .addSeparatorComponents(separator)
        .addSectionComponents(generalSupportSection)
        .addSectionComponents(bugReportSection)
        .addSectionComponents(suggestionSection)
        .addSectionComponents(partnershipSection)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(infoText);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
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

