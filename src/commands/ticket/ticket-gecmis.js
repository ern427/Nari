const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { TICKET_CATEGORIES } = require("../../utils/ticketManager");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "ticket-gecmis",
    description: "Bir kullanıcının ticket geçmişini gösterir.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Geçmişi görüntülenecek kullanıcı.",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      // FIX: Guard against db not being initialized yet
      if (!interaction.client.db) {
        return interaction.reply({ content: "Veritabanı henüz hazır değil, lütfen tekrar deneyin.", ephemeral: true });
      }

      const user = interaction.options.getUser("kullanici");

      await interaction.deferReply();

      // FIX: Use allAsync() instead of callback-wrapped new Promise().
      //
      // ROOT CAUSE: Same as warnings.js — db.all() doesn't exist on the
      // client.db instance if it was assigned before the sql.js shim finished
      // patching it. allAsync() is the safe, always-present async wrapper.
      const tickets = await interaction.client.db.allAsync(
        "SELECT * FROM ticket_system WHERE ownerId = ? AND guildId = ? ORDER BY createdAt DESC",
        [user.id, interaction.guild.id],
      );

      if (tickets.length === 0) {
        return interaction.editReply({
          content: `${user.tag} kullanıcısının ticket geçmişi bulunamadı.`,
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`${user.tag} — Ticket Geçmişi`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`Toplam ticket: **${tickets.length}**`)
        .setTimestamp();

      tickets.slice(0, 25).forEach((ticket, index) => {
        const status     = ticket.closedAt ? "✅ Kapalı" : "🔴 Açık";
        const category   = TICKET_CATEGORIES[ticket.category]?.label || ticket.category;
        const createdDate = new Date(ticket.createdAt).toLocaleString("tr-TR");
        const closedDate  = ticket.closedAt
          ? new Date(ticket.closedAt).toLocaleString("tr-TR")
          : "Hala açık";

        embed.addFields({
          name: `${index + 1}. ${ticket.ticketId} — ${status}`,
          value: `**Kategori:** ${category}\n**Açılış:** ${createdDate}\n**Kapanış:** ${closedDate}`,
          inline: false,
        });
      });

      if (tickets.length > 25) {
        embed.setFooter({ text: `Toplam ${tickets.length} ticket. İlk 25 gösteriliyor.` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`[ticket-gecmis] ${error.message}`);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: "Ticket geçmişi getirilirken bir hata oluştu.",
        });
      }

      return interaction.reply({
        content: "Ticket geçmişi getirilirken bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
