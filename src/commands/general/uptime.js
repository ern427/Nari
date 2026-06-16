const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "uptime",
    description: "Botun çalışma süresini gösterir.",
  },
  async execute(interaction) {
    try {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      return interaction.reply({ content: `Bot ${hours} saat ${minutes} dakika ${seconds} saniyedir çevrimiçi.`, ephemeral: true });
    } catch (error) {
      logger.error(`[uptime] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Uptime bilgisi alınırken bir hata oluştu.", ephemeral: true });
    }
  },
};