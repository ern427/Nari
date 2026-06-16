const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { setAutoRoleSettings } = require("../../utils/settingsManager");

module.exports = {
  data: {
    name: "otorol-ayarla",
    description: "Yeni üyelere otomatik rol verir.",
    options: [
      {
        name: "rol",
        type: 8,
        description: "Yeni kullanıcılara verilecek rol.",
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

      const role = interaction.options.getRole("rol");
      if (!role) {
        return interaction.reply({ content: "Lütfen geçerli bir rol seçin.", ephemeral: true });
      }

      await setAutoRoleSettings(interaction.guild.id, role.id, true, interaction.client.db);
      return interaction.reply({ content: `✅ Otorol olarak ${role} ayarlandı. Yeni üyeler bu rolü alacak.`, ephemeral: true });
    } catch (error) {
      logger.error(`[otorol-ayarla] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Otorol ayarlanırken bir hata oluştu.", ephemeral: true });
    }
  },
};