const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "ticket-istatistik",
    description: "Ticket sistemi istatistiklerini gösterir.",
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      await interaction.deferReply();

      // Get all tickets
      const allTickets = await new Promise((resolve, reject) => {
        interaction.client.db.all(
          "SELECT * FROM ticket_system WHERE guildId = ?",
          [interaction.guild.id],
          (error, rows) => {
            if (error) reject(error);
            else resolve(rows || []);
          },
        );
      });

      // Get open tickets
      const openTickets = await new Promise((resolve, reject) => {
        interaction.client.db.all(
          "SELECT * FROM ticket_system WHERE guildId = ? AND closedAt IS NULL",
          [interaction.guild.id],
          (error, rows) => {
            if (error) reject(error);
            else resolve(rows || []);
          },
        );
      });

      // Get closed tickets
      const closedTickets = allTickets.length - openTickets.length;

      // Get top ticket creators
      const topCreators = await new Promise((resolve, reject) => {
        interaction.client.db.all(
          `SELECT ownerId, COUNT(*) as count FROM ticket_system 
           WHERE guildId = ? 
           GROUP BY ownerId 
           ORDER BY count DESC 
           LIMIT 5`,
          [interaction.guild.id],
          async (error, rows) => {
            if (error) {
              reject(error);
            } else {
              // Get user info for each creator
              const creators = [];
              for (const row of rows || []) {
                try {
                  const user = await interaction.client.users.fetch(row.ownerId);
                  creators.push({ user: user.tag, count: row.count });
                } catch (err) {
                  creators.push({ user: `ID: ${row.ownerId}`, count: row.count });
                }
              }
              resolve(creators);
            }
          },
        );
      });

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Ticket İstatistikleri")
        .setDescription(`${interaction.guild.name} sunucusunun ticket istatistikleri`)
        .addFields(
          { name: "📊 Toplam Ticket", value: `${allTickets.length}`, inline: true },
          { name: "🔴 Açık Ticket", value: `${openTickets.length}`, inline: true },
          { name: "✅ Kapalı Ticket", value: `${closedTickets}`, inline: true },
        )
        .setTimestamp();

      if (topCreators.length > 0) {
        const topCreatorsText = topCreators.map((creator, index) => `${index + 1}. ${creator.user} - ${creator.count} ticket`).join("\n");

        embed.addFields({ name: "👑 En Çok Ticket Açanlar", value: topCreatorsText, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`[ticket-istatistik] ${error.message}`);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: "İstatistikler getirilirken bir hata oluştu.",
        });
      }

      return interaction.reply({
        content: "İstatistikler getirilirken bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
