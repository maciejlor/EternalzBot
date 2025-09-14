// TruckersMP Event Command
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags, SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');

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
        .setDescription('Route map image URL')
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
      
      // We'll send the event announcement directly as the main reply

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
        const errorText = new TextDisplayBuilder()
          .setContent(`❌ **Geçersiz Zaman Formatı**\n${error.message}\n\n**Örnekler:**\n• "17:00" (17:00 UTC)\n• "18:30 UTC"\n• "1694786400" (Unix timestamp)`);

        const container = new ContainerBuilder()
          .setAccentColor(0x5b5078)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container],
          ephemeral: true
        });
      }

    // Create the event information section
    const eventInfoText = new TextDisplayBuilder()
      .setContent(
        `## <:ETeventnote:1372172882649546832>  Etkinlik Bilgileri\n` +
        `<:ETeventinfo:1372172879994683543>  Tarih: ${date}\n` +
        `<:ETtime:1372172933002301561>  Toplanma Saati: <t:${meetTimeNum}:t>\n` +
        `<:ETtime:1372172933002301561> Ayrılış Saati: <t:${departureTimeNum}:t>\n` +
        `<:ETstart:1372176513935347804>  Başlangıç Şehri: ${startCity}\n` +
        `<:ETend:1372176547804610680>  Bitiş Şehri: ${endCity}\n` +
        `<:ETevent:1371863304833597542>  Sunucu: ${server}\n` +
        `<:ETDLC:1372178157008064573>  DLC Gerekli: ${dlc}`
      );

    const separator1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);

    // Create the slot information section
    const slotInfoText = new TextDisplayBuilder()
      .setContent(
        `## <:ETeventnote:1372172882649546832>  Slot\n` +
        `<:ETDLC:1372178157008064573> **Firmalar & Şehir: ${slotCompanies}**\n` +
        `<:ETDLC:1372178157008064573> **Slot Sayısı: ${slotNumber}**`
      );
    
    // Create slot image gallery
    const slotImageGallery = new MediaGalleryBuilder()
      .addItems(new MediaGalleryItemBuilder().setURL(slotImage));

    const separator2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);

    // Create the route information section
    const routeInfoText = new TextDisplayBuilder()
      .setContent(
        `## <:ETeventnote:1372172882649546832>  Rota\n` +
        `<:ETDLC:1372178157008064573> **Rota Uzunluğu: ${kmRoute} km**`
      );
    
    // Create route image gallery
    const routeImageGallery = new MediaGalleryBuilder()
      .addItems(new MediaGalleryItemBuilder().setURL(routeImage));

    const separator3 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);

    // Create the truck and trailer information section
    const vehicleInfoText = new TextDisplayBuilder()
      .setContent(
        `## <:ETeventnote:1372172882649546832> Kamyon ve Dorse Bilgileri\n` +
        `<:etarrow:1372179048242872342>  Kamyon Adı: ${truckName}\n` +
        `<:etarrow:1372179048242872342>  Dorse Adı: ${trailerName}`
      );
    
    // Create truck and trailer image gallery
    const vehicleImageGallery = new MediaGalleryBuilder()
      .addItems(
        new MediaGalleryItemBuilder().setURL(imgurTruck),
        new MediaGalleryItemBuilder().setURL(imgurTrailer)
      );

    // Create banner image at the end
    const bannerImageGallery = new MediaGalleryBuilder()
      .addItems(new MediaGalleryItemBuilder().setURL('https://i.imgur.com/S7b0oIZ.png'));

    // Create the main container
    const container = new ContainerBuilder()
      .setAccentColor(0x5b5078)
      .addTextDisplayComponents(eventInfoText)
      .addSeparatorComponents(separator1)
      .addTextDisplayComponents(slotInfoText)
      .addMediaGalleryComponents(slotImageGallery)
      .addSeparatorComponents(separator2)
      .addTextDisplayComponents(routeInfoText)
      .addMediaGalleryComponents(routeImageGallery)
      .addSeparatorComponents(separator3)
      .addTextDisplayComponents(vehicleInfoText)
      .addMediaGalleryComponents(vehicleImageGallery);

      // Send @everyone ping + embed together in ONE message
      console.log('[EVENT] Sending ping + embed together');
      
      // Add @everyone to the first text component of the embed
      const eventInfoTextWithPing = new TextDisplayBuilder()
        .setContent(
          (canMentionEveryone ? '@everyone\n\n' : '') +
          `## <:ETeventnote:1372172882649546832>  Etkinlik Bilgileri\n` +
          `<:ETeventinfo:1372172879994683543>  Tarih: ${date}\n` +
          `<:ETtime:1372172933002301561>  Toplanma Saati: <t:${meetTimeNum}:t>\n` +
          `<:ETtime:1372172933002301561> Ayrılış Saati: <t:${departureTimeNum}:t>\n` +
          `<:ETstart:1372176513935347804>  Başlangıç Şehri: ${startCity}\n` +
          `<:ETend:1372176547804610680>  Bitiş Şehri: ${endCity}\n` +
          `<:ETevent:1371863304833597542>  Sunucu: ${server}\n` +
          `<:ETDLC:1372178157008064573>  DLC Gerekli: ${dlc}`
        );

      // Recreate container with ping in the embed
      const containerWithPing = new ContainerBuilder()
        .setAccentColor(0x5b5078)
        .addTextDisplayComponents(eventInfoTextWithPing)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(slotInfoText)
        .addMediaGalleryComponents(slotImageGallery)
        .addSeparatorComponents(separator2)
        .addTextDisplayComponents(routeInfoText)
        .addMediaGalleryComponents(routeImageGallery)
        .addSeparatorComponents(separator3)
        .addTextDisplayComponents(vehicleInfoText)
        .addMediaGalleryComponents(vehicleImageGallery)
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
        .addMediaGalleryComponents(bannerImageGallery);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [containerWithPing],
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
