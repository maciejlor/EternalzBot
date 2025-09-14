// src/slashCommands/Info/refresh.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
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
      const errorText = new TextDisplayBuilder()
        .setContent(`${config.crossmark_emoji || '❌'} **Access Denied**\nYou need Administrator permissions to use this command.`);

      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
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
      const successText = new TextDisplayBuilder()
        .setContent(
          `${config.checkmark_emoji || '✅'} **Commands Refreshed Successfully!**\n\n` +
          `**Loaded Commands:** ${loadedCommands.length}\n` +
          `${loadedCommands.map(name => `• \`${name}\``).join('\n')}\n\n` +
          (skippedCommands.length > 0 ? 
            `**Skipped Commands:** ${skippedCommands.length}\n` +
            `${skippedCommands.map(name => `• \`${name}\``).join('\n')}` 
            : ''
          )
        );

      const separator = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(successText)
        .addSeparatorComponents(separator);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      console.log(`[REFRESH] Commands refreshed by ${interaction.user.tag} (${interaction.user.id})`);

    } catch (error) {
      console.error('[REFRESH ERROR]', error);

      const errorText = new TextDisplayBuilder()
        .setContent(
          `${config.crossmark_emoji || '❌'} **Refresh Failed**\n\n` +
          `An error occurred while refreshing commands:\n\`\`\`${error.message}\`\`\``
        );

      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(errorText);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      }).catch(console.error);
    }
  },
};

