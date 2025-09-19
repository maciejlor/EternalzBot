// TruckersMP Event Command
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Create a TruckersMP event announcement')
    .setDefaultMemberPermissions(0) // Hide from everyone by default - use server integration settings to enable for specific roles
    .addStringOption(option =>
      option.setName('meet_time')
        .setDescription('Meeting time (e.g., "17:00" or "17:00 UTC")')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('departure_time')
        .setDescription('Departure time (e.g., "18:30" or "18:30 UTC")')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Event date (e.g., 15 Eylül 2024)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('start_city')
        .setDescription('Starting city')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('end_city')
        .setDescription('Ending city')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('slot_companies')
        .setDescription('Companies and cities for slots')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('slot_number')
        .setDescription('Number of available slots')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('slot_image')
        .setDescription('Image URL for slot information')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('server')
        .setDescription('TruckersMP server (e.g., Europe #1)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('km_route')
        .setDescription('Route distance in kilometers')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('route_image')
        .setDescription('Image URL for route map')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('truck_name')
        .setDescription('Required truck name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('trailer_name')
        .setDescription('Required trailer name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('imgur_truck')
        .setDescription('Imgur URL for truck image')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('imgur_trailer')
        .setDescription('Imgur URL for trailer image')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('dlc')
        .setDescription('Required DLC (e.g., "West Balkans DLC")')
        .setRequired(false)),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    try {
      console.log('[EVENT] Command started');
      
      // Check if user has the Event Manager role or Administrator permission
      const eventManagerRoleId = '1416415883731009709';
      const member = interaction.member;
      const hasEventManagerRole = member.roles.cache.has(eventManagerRoleId);
      const hasAdminPermission = member.permissions.has(PermissionsBitField.Flags.Administrator);
      
      if (!hasEventManagerRole && !hasAdminPermission) {
        console.log('[EVENT] User does not have Event Manager role or Admin permission');
        return interaction.reply({
          content: '❌ **Yetkisiz Erişim**\nBu komutu kullanma yetkiniz yok. Sadece **Event Manager** rolüne sahip kullanıcılar veya yöneticiler etkinlik oluşturabilir.',
          ephemeral: true
        });
      }
      
      console.log('[EVENT] User has Event Manager role, proceeding...');
      
      // Check if bot has permission to mention everyone
      const botMember = interaction.guild.members.me;
      const canMentionEveryone = botMember.permissions.has(PermissionsBitField.Flags.MentionEveryone);
      console.log('[EVENT] Can mention everyone:', canMentionEveryone);

      // Get all the options
      console.log('[EVENT] Getting options');
      const meetTime = interaction.options.getString('meet_time');
      const departureTime = interaction.options.getString('departure_time');
      const date = interaction.options.getString('date');
      const startCity = interaction.options.getString('start_city');
      const endCity = interaction.options.getString('end_city');
      const slotCompanies = interaction.options.getString('slot_companies');
      const slotNumber = interaction.options.getString('slot_number');
      const slotImage = interaction.options.getString('slot_image');
      const server = interaction.options.getString('server');
      const kmRoute = interaction.options.getString('km_route');
      const routeImage = interaction.options.getString('route_image');
      const truckName = interaction.options.getString('truck_name');
      const trailerName = interaction.options.getString('trailer_name');
      const imgurTruck = interaction.options.getString('imgur_truck');
      const imgurTrailer = interaction.options.getString('imgur_trailer');
      const dlc = interaction.options.getString('dlc') || 'Belirtilmedi';

      // Convert human-readable time to Unix timestamp
      console.log('[EVENT] Converting times to timestamps');
      let meetTimeNum, departureTimeNum;
      
      function parseTimeToTimestamp(timeString, eventDate) {
        // Remove "UTC" and extra spaces
        const cleanTime = timeString.replace(/UTC/gi, '').trim();
        
        // Check if it's already a Unix timestamp
        if (/^\d{10}$/.test(cleanTime)) {
          return parseInt(cleanTime);
        }
        
        // Parse time format like "17:00", "17:30", etc.
        const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
        if (!timeMatch) {
          throw new Error(`Invalid time format: ${timeString}. Use format like "17:00" or "17:00 UTC"`);
        }
        
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error(`Invalid time: ${timeString}. Hours must be 0-23, minutes 0-59`);
        }
        
        // Create date object for today in UTC
        const now = new Date();
        const eventDateTime = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          hours,
          minutes,
          0
        ));
        
        // If the time has already passed today, set it for tomorrow
        if (eventDateTime < now) {
          eventDateTime.setUTCDate(eventDateTime.getUTCDate() + 1);
        }
        
        return Math.floor(eventDateTime.getTime() / 1000);
      }
      
      try {
        meetTimeNum = parseTimeToTimestamp(meetTime, date);
        departureTimeNum = parseTimeToTimestamp(departureTime, date);
        
        console.log('[EVENT] Converted times:', { 
          meetTime: `${meetTime} -> ${meetTimeNum}`, 
          departureTime: `${departureTime} -> ${departureTimeNum}` 
        });
        
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Geçersiz Zaman Formatı')
          .setDescription(`${error.message}\n\n**Örnekler:**\n• "17:00" (17:00 UTC)\n• "18:30 UTC"\n• "1694786400" (Unix timestamp)`)
          .setTimestamp();

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Create the main event embed
      const eventEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setTitle('🚛 Etkinlik Bilgileri')
        .addFields([
          { name: '📅 Tarih', value: date, inline: true },
          { name: '🕐 Toplanma Saati', value: `<t:${meetTimeNum}:t>`, inline: true },
          { name: '🕐 Ayrılış Saati', value: `<t:${departureTimeNum}:t>`, inline: true },
          { name: '🏁 Başlangıç Şehri', value: startCity, inline: true },
          { name: '🏁 Bitiş Şehri', value: endCity, inline: true },
          { name: '🌐 Sunucu', value: server, inline: true },
          { name: '📦 DLC Gerekli', value: dlc, inline: true },
          { name: '📊 Slot Bilgileri', value: `**Firmalar & Şehir:** ${slotCompanies}\n**Slot Sayısı:** ${slotNumber}`, inline: false }
        ])
        .setImage(slotImage)
        .setTimestamp()
        .setFooter({ text: 'EternalZ Event', iconURL: client.user.displayAvatarURL() });

      // Create route embed
      const routeEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setTitle('🗺️ Rota Bilgileri')
        .addFields([
          { name: '📏 Mesafe', value: `${kmRoute} km`, inline: true },
          { name: '🛣️ Rota', value: `${startCity} ➜ ${endCity}`, inline: true }
        ])
        .setImage(routeImage);

      // Create vehicle embed
      const vehicleEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setTitle('🚚 Araç Bilgileri')
        .addFields([
          { name: '🚛 Kamyon', value: truckName, inline: true },
          { name: '🚛 Dorse', value: trailerName, inline: true }
        ])
        .setImage(imgurTruck);

      // Create trailer embed
      const trailerEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setTitle('🚛 Dorse Detayı')
        .setImage(imgurTrailer);

      // Create banner embed
      const bannerEmbed = new EmbedBuilder()
        .setColor('#5b5078')
        .setImage('https://i.imgur.com/S7b0oIZ.png');

      // Send the message with @everyone ping if allowed
      const content = canMentionEveryone ? '@everyone' : '';

      await interaction.reply({
        content: content,
        embeds: [eventEmbed, routeEmbed, vehicleEmbed, trailerEmbed, bannerEmbed],
        allowedMentions: canMentionEveryone ? { 
          everyone: true,
          parse: ['everyone']
        } : undefined
      });
      
      console.log('[EVENT] Command completed successfully');
      
    } catch (error) {
      console.error('[EVENT] Error:', error);
      
      try {
        await interaction.reply({
          content: `❌ Error: ${error.message}`,
          ephemeral: true
        });
      } catch (replyError) {
        console.error('[EVENT] Reply error:', replyError);
      }
    }
  },
};