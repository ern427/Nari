const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { requireAdmin } = require("../../utils/permissionHandler");
const { TICKET_CATEGORIES } = require("../../utils/ticketManager");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "ticket-panel",
    description: "Ticket sistemi panelini oluşturur.",
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireAdmin(interaction))) return;

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Ticket Sistemi")
        .setDescription("Aşağıdan bir kategori seçerek yeni bir ticket açınız.")
        .addFields(
          { name: "📋 Kategori Seçin", value: "Sorununuzu en iyi açıklayan kategoriyi seçiniz." },
          { name: "⚠️ Önemli", value: "Aynı anda maksimum 2 ticket açabilirsiniz." },
        )
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticket_category_select")
        .setPlaceholder("Kategori seçiniz...")
        .addOptions(
          Object.entries(TICKET_CATEGORIES).map(([key, value]) => ({
            label: value.label,
            description: value.description,
            value: key,
            emoji: value.emoji,
          })),
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

      logger.info(`[ticket-panel] Panel ${interaction.user.tag} tarafından oluşturuldu.`);
    } catch (error) {
      logger.error(`[ticket-panel] ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: "Bir hata oluştu.",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: "Bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
