const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { setAutoRoleSettings } = require("../../utils/settingsManager");

module.exports = {
  data: {
    name: "otorol-kapat",
    description: "Otorol sistemini devre dışı bırakır.",
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      await setAutoRoleSettings(interaction.guild.id, null, false, interaction.client.db);
      return interaction.reply({ content: "✅ Otorol kapatıldı.", ephemeral: true });
    } catch (error) {
      logger.error(`[otorol-kapat] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Otorol kapatılırken bir hata oluştu.", ephemeral: true });
    }
  },
};