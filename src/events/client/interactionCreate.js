const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            // Handle button interactions for tickets
            if (interaction.isButton()) {
                // Ticket creation buttons
                if (interaction.customId.startsWith('ticket_')) {
                    const ticketType = interaction.customId.replace('ticket_', '');
                    const user = interaction.user;
                    const guild = interaction.guild;
                    
                    // Check if user already has a ticket
                    const existingTicket = guild.channels.cache.find(
                        channel => channel.name === `ticket-${user.username.toLowerCase()}` && 
                        channel.type === ChannelType.GuildText
                    );
                    
                    if (existingTicket) {
                        return interaction.reply({
                            content: `❌ Zaten aktif bir ticket'ınız var: ${existingTicket}`,
                            ephemeral: true
                        });
                    }
                    
                    await interaction.deferReply({ ephemeral: true });
                    
                    const ticketTypes = {
                        general: { name: '🛠️ Genel Destek', description: 'Genel sorular ve teknik destek' },
                        bug: { name: '🐛 Hata Bildirimi', description: 'Hata bildirimi' },
                        suggestion: { name: '💡 Öneri', description: 'Öneri ve fikirler' },
                        partnership: { name: '🤝 Ortaklık', description: 'İş birliği ve ortaklık' }
                    };
                    
                    const ticketInfo = ticketTypes[ticketType] || ticketTypes.general;
                    
                    // Create ticket channel
                    const ticketChannel = await guild.channels.create({
                        name: `ticket-${user.username.toLowerCase()}`,
                        type: ChannelType.GuildText,
                        parent: interaction.channel.parentId,
                        topic: `${ticketInfo.description} - ${user.tag} (${user.id})`,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                        ],
                    });
                    
                    const welcomeText = new TextDisplayBuilder()
                        .setContent(
                            `**${ticketInfo.name}**\n\n` +
                            `Merhaba ${user}, ticket'ınız başarıyla oluşturuldu!\n\n` +
                            `**Ticket Türü:** ${ticketInfo.description}\n` +
                            `**Oluşturulma Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                            `Lütfen sorununuzu detaylı bir şekilde açıklayın.`
                        );
                    
                    const closeButton = new ButtonBuilder()
                        .setCustomId(`close_ticket_${ticketChannel.id}`)
                        .setLabel('🔒 Ticket\'ı Kapat')
                        .setStyle(ButtonStyle.Danger);
                    
                    const actionRow = new ActionRowBuilder().addComponents(closeButton);
                    
                    const container = new ContainerBuilder()
                        .setAccentColor(0x5b5078)
                        .addTextDisplayComponents(welcomeText);
                    
                    await ticketChannel.send({
                        content: `${user}`,
                        flags: MessageFlags.IsComponentsV2,
                        components: [container, actionRow],
                    });
                    
                    await interaction.editReply({
                        content: `✅ Ticket'ınız başarıyla oluşturuldu: ${ticketChannel}`,
                    });
                    
                    return;
                }
                
                // Close ticket button
                if (interaction.customId.startsWith('close_ticket_')) {
                    const user = interaction.user;
                    const channel = interaction.channel;
                    
                    if (!channel.name.startsWith('ticket-')) {
                        return interaction.reply({
                            content: '❌ Bu komut sadece ticket kanallarında kullanılabilir.',
                            ephemeral: true
                        });
                    }
                    
                    await interaction.reply({
                        content: `🔒 Ticket ${user} tarafından kapatılıyor... (5 saniye içinde silinecek)`,
                    });
                    
                    setTimeout(async () => {
                        try {
                            await channel.delete('Ticket kapatıldı');
                        } catch (error) {
                            console.error('[TICKET] Error deleting channel:', error);
                        }
                    }, 5000);
                    
                    return;
                }
            }

            if (!interaction.isChatInputCommand()) return;

            // Block commands in DMs
            if (!interaction.guild) {
                const accentColor = parseInt(config.color.replace('#', ''), 16);
                const dmBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command can only be used in a server.`)
                    );

                return interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [dmBlock],
                });
            }

            // Run command
            const command = client.slash.get(interaction.commandName);
            if (!command) return;

            await command.run(client, interaction, interaction.options);

        } catch (err) {
            console.error('[INTERACTION ERROR]', err);

            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('An unexpected error occurred while handling this interaction.')
                    );
                interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [errorBlock],
                }).catch(console.error);
            }
        }
    },
};
