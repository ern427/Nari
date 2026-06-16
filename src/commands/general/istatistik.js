const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "istatistik",
    description: "Botun genel istatistiklerini gösterir.",
  },
  async execute(interaction) {
    try {
      if (!(await requireModerator(interaction))) return;

      const uptime = process.uptime();
      const memory = process.memoryUsage();
      const totalGuilds = interaction.client.guilds.cache.size;
      const totalUsers = interaction.client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      const uptimeSeconds = Math.floor(uptime % 60);

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("📈 Bot İstatistikleri")
        .addFields(
          { name: "Sunucu Sayısı", value: `${totalGuilds}`, inline: true },
          { name: "Kullanıcı Sayısı", value: `${totalUsers}`, inline: true },
          { name: "Uptime", value: `${uptimeHours} saat ${uptimeMinutes} dakika ${uptimeSeconds} saniye`, inline: true },
          { name: "RSS Bellek", value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
          { name: "Heap Kullanımı", value: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`, inline: true },
          { name: "Heap Toplam", value: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`, inline: true },
          { name: "CPU Count", value: `${require("os").cpus().length}`, inline: true },
          { name: "Node.js", value: `${process.version}`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`[istatistik] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "İstatistikler alınırken bir hata oluştu.", ephemeral: true });
    }
  },
};