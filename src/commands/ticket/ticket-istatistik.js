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

      // FIX: Guard against db not being initialized yet
      if (!interaction.client.db) {
        return interaction.reply({ content: "Veritabanı henüz hazır değil, lütfen tekrar deneyin.", ephemeral: true });
      }

      await interaction.deferReply();

      // FIX: Use allAsync() for all three queries — eliminates the callback
      // pattern and the "db.all is not a function" error.
      //
      // ORIGINAL BUG 1: db.all() was called with the sqlite3 callback style.
      //   If client.db was set before the sql.js shim finished patching the
      //   instance, .all() didn't exist → runtime crash.
      //
      // ORIGINAL BUG 2: The topCreators query used `async (error, rows) => {}`
      //   as the callback. Any exception thrown inside an async callback passed
      //   to new Promise() is NOT caught by the outer reject() — it becomes an
      //   unhandled promise rejection. The interaction would time out silently
      //   because editReply() was never called.

      const allTickets = await interaction.client.db.allAsync(
        "SELECT * FROM ticket_system WHERE guildId = ?",
        [interaction.guild.id],
      );

      const openTickets = await interaction.client.db.allAsync(
        "SELECT * FROM ticket_system WHERE guildId = ? AND closedAt IS NULL",
        [interaction.guild.id],
      );

      const closedCount = allTickets.length - openTickets.length;

      // FIX: Run the aggregate query with allAsync, then resolve user info
      // using Promise.allSettled so one failed fetch doesn't abort everything.
      const topCreatorRows = await interaction.client.db.allAsync(
        `SELECT ownerId, COUNT(*) as count FROM ticket_system
         WHERE guildId = ?
         GROUP BY ownerId
         ORDER BY count DESC
         LIMIT 5`,
        [interaction.guild.id],
      );

      // FIX: Resolve all user fetches in parallel. Use allSettled so a single
      // unknown/deleted user doesn't crash the whole command.
      const topCreators = await Promise.allSettled(
        topCreatorRows.map(async (row) => {
          try {
            const user = await interaction.client.users.fetch(row.ownerId);
            return { user: user.tag, count: row.count };
          } catch {
            return { user: `ID: ${row.ownerId}`, count: row.count };
          }
        }),
      ).then((results) =>
        results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value),
      );

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Ticket İstatistikleri")
        .setDescription(`${interaction.guild.name} sunucusunun ticket istatistikleri`)
        .addFields(
          { name: "📊 Toplam Ticket", value: `${allTickets.length}`, inline: true },
          { name: "🔴 Açık Ticket",   value: `${openTickets.length}`, inline: true },
          { name: "✅ Kapalı Ticket", value: `${closedCount}`, inline: true },
        )
        .setTimestamp();

      if (topCreators.length > 0) {
        const topCreatorsText = topCreators
          .map((creator, index) => `${index + 1}. ${creator.user} — ${creator.count} ticket`)
          .join("\n");

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
