const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { setRulesSettings } = require("../../utils/settingsManager");

module.exports = {
  data: {
    name: "kurallar-ayarla",
    description: "Yeni gelen üyeye DM olarak kuralları gönderir.",
    options: [
      {
        name: "kurallar",
        type: 3,
        description: "Gönderilecek kurallar metni.",
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

      const rulesText = interaction.options.getString("kurallar");
      await setRulesSettings(interaction.guild.id, rulesText, true, interaction.client.db);

      return interaction.reply({ content: "✅ Kurallar DM olarak gönderilecek şekilde ayarlandı.", ephemeral: true });
    } catch (error) {
      logger.error(`[kurallar-ayarla] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Kurallar ayarlanırken bir hata oluştu.", ephemeral: true });
    }
  },
};