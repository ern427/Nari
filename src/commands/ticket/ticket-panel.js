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

      // FIX: ticket-panel.js has no direct db calls, so it was NOT broken by
      // the sql.js migration. However, there is one silent failure risk:
      //
      // If TICKET_CATEGORIES is undefined or empty (e.g. ticketManager.js has
      // a bug or export name mismatch), Object.entries() returns [] and
      // StringSelectMenuBuilder throws because Discord requires at least 1 option.
      //
      // This guard surfaces that problem instead of crashing silently.
      const categoryEntries = Object.entries(TICKET_CATEGORIES || {});

      if (categoryEntries.length === 0) {
        logger.error("[ticket-panel] TICKET_CATEGORIES is empty or undefined — check ticketManager.js exports.");
        return interaction.reply({
          content: "Ticket kategorileri yüklenemedi. Lütfen bot yöneticisiyle iletişime geçin.",
          ephemeral: true,
        });
      }

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
          categoryEntries.map(([key, value]) => ({
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
