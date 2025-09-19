// src/slashCommands/Info/refresh.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');
const fs = require('fs');
const { REST, Routes } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Refresh and reload all bot commands')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`${config.crossmark_emoji || '❌'} Access Denied`)
        .setDescription('You need Administrator permissions to use this command.')
        .setTimestamp();

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Clear existing commands from client collection
      client.slash.clear();

      // Reload commands from filesystem
      const slash = [];
      let loadedCommands = [];
      let skippedCommands = [];

      // Clear require cache for all command files
      const clearCache = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = `${dir}/${file}`;
          if (fs.statSync(fullPath).isDirectory()) {
            clearCache(fullPath);
          } else if (file.endsWith('.js')) {
            const modulePath = require.resolve(`../../slashCommands/${dir.split('/').pop()}/${file}`);
            delete require.cache[modulePath];
          }
        });
      };

      // Clear cache for all command directories
      fs.readdirSync('./src/slashCommands/').forEach(dir => {
        clearCache(`./src/slashCommands/${dir}`);
      });

      // Reload commands
      fs.readdirSync('./src/slashCommands/').forEach(dir => {
        const commands = fs.readdirSync(`./src/slashCommands/${dir}`).filter(file => file.endsWith('.js'));

        for (let file of commands) {
          try {
            const commandModule = require(`../../slashCommands/${dir}/${file}`);

            if (commandModule.data && commandModule.data instanceof SlashCommandBuilder) {
              slash.push(commandModule.data.toJSON());
              client.slash.set(commandModule.data.name, commandModule);
              loadedCommands.push(commandModule.data.name);
            } else {
              skippedCommands.push(file);
            }
          } catch (error) {
            console.error(`Error loading command ${file}:`, error);
            skippedCommands.push(`${file} (error)`);
          }
        }
      });

      // Re-register commands with Discord API
      const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENTID),
        { body: slash }
      );

      // Build success message
      const successEmbed = new EmbedBuilder()
        .setColor(config.color || '#5b5078')
        .setTitle(`${config.checkmark_emoji || '✅'} Commands Refreshed Successfully!`)
        .addFields([
          { 
            name: `Loaded Commands (${loadedCommands.length})`, 
            value: loadedCommands.length > 0 ? loadedCommands.map(name => `• \`${name}\``).join('\n') : 'None',
            inline: false 
          }
        ])
        .setTimestamp();

      if (skippedCommands.length > 0) {
        successEmbed.addFields([
          { 
            name: `Skipped Commands (${skippedCommands.length})`, 
            value: skippedCommands.map(name => `• \`${name}\``).join('\n'),
            inline: false 
          }
        ]);
      }

      await interaction.editReply({
        embeds: [successEmbed]
      });

      console.log(`[REFRESH] Commands refreshed by ${interaction.user.tag} (${interaction.user.id})`);

    } catch (error) {
      console.error('[REFRESH ERROR]', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`${config.crossmark_emoji || '❌'} Refresh Failed`)
        .setDescription(`An error occurred while refreshing commands:\n\`\`\`${error.message}\`\`\``)
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed]
      }).catch(console.error);
    }
  },
};

