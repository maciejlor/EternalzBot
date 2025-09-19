// src/slashCommands/Utility/ping.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the app latency and status!'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    // Check app permissions
    const requiredAppPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ReadMessageHistory,
    ];

    const appPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
    const missingPerms = requiredAppPermissions.filter((perm) => !appPerms.has(perm));

    if (missingPerms.length > 0) {
      const permNames = missingPerms
        .map((perm) => Object.keys(PermissionsBitField.Flags).find((key) => PermissionsBitField.Flags[key] === perm))
        .join(', ');

      const errorEmbed = new EmbedBuilder()
        .setColor(config.color || '#5b5078')
        .setTitle('⚠ Missing Permissions')
        .setDescription(`I need the following permissions to run this command:\n**${permNames}**`)
        .setTimestamp();

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }

    // Measure latency
    const sent = Date.now();
    
    const pingEmbed = new EmbedBuilder()
      .setColor(config.color || '#5b5078')
      .setTitle('🏓 Pong!')
      .addFields([
        { name: 'WebSocket Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: 'API Response Time', value: `${Date.now() - sent}ms`, inline: true }
      ])
      .setTimestamp()
      .setFooter({ text: 'Bot Status', iconURL: client.user.displayAvatarURL() });

    await interaction.reply({
      embeds: [pingEmbed]
    });
  },
};
