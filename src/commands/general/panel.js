const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "panel",
    description: "Sunucu ve bot panelini gösterir.",
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      const uptimeSeconds = Math.floor(uptime % 60);
      const uptimeText = `${uptimeHours} saat ${uptimeMinutes} dakika ${uptimeSeconds} saniye`;

      const ramMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
      const cpuUsage = process.cpuUsage();
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000 / uptime) * 100 || 0;

      const totalUsers = interaction.client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
      const totalGuilds = interaction.client.guilds.cache.size;

      const stats = await new Promise((resolve, reject) => {
        interaction.client.db.all(
          "SELECT COUNT(*) as totalTickets, SUM(CASE WHEN closedAt IS NULL THEN 1 ELSE 0 END) as openTickets FROM ticket_system WHERE guildId = ?",
          [interaction.guild.id],
          (error, rows) => {
            if (error) return reject(error);
            resolve(rows[0] || { totalTickets: 0, openTickets: 0 });
          },
        );
      });

      const totalWarnings = await new Promise((resolve, reject) => {
        interaction.client.db.get(
          "SELECT COUNT(*) as count FROM warnings WHERE guildId = ?",
          [interaction.guild.id],
          (error, row) => {
            if (error) return reject(error);
            resolve(row?.count || 0);
          },
        );
      });

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("📊 Nari Paneli")
        .addFields(
          { name: "Ping", value: `${interaction.client.ws.ping} ms`, inline: true },
          { name: "Uptime", value: uptimeText, inline: true },
          { name: "RAM", value: `${ramMB} MB`, inline: true },
          { name: "CPU", value: `${cpuPercent.toFixed(2)} %`, inline: true },
          { name: "Sunucu Sayısı", value: `${totalGuilds}`, inline: true },
          { name: "Kullanıcı Sayısı", value: `${totalUsers}`, inline: true },
          { name: "Açık Ticket", value: `${stats.openTickets || 0}`, inline: true },
          { name: "Toplam Ticket", value: `${stats.totalTickets || 0}`, inline: true },
          { name: "Toplam Warn", value: `${totalWarnings}`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`[panel] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Panel bilgileri alınırken bir hata oluştu.", ephemeral: true });
    }
  },
};