const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { setWelcomeSettings } = require("../../utils/settingsManager");

module.exports = {
  data: {
    name: "hosgeldin-kapat",
    description: "Karşılama sistemini kapatır.",
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      await setWelcomeSettings(interaction.guild.id, { enabled: false }, interaction.client.db);
      return interaction.reply({ content: "✅ Karşılama sistemi kapatıldı.", ephemeral: true });
    } catch (error) {
      logger.error(`[hosgeldin-kapat] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Karşılama kapatılırken bir hata oluştu.", ephemeral: true });
    }
  },
};