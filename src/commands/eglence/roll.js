module.exports = {
  data: {
    name: "roll",
    description: "1 ile 100 arasında rastgele bir sayı atar.",
    options: [
      { name: "max", type: 4, description: "En yüksek sayı (opsiyonel, varsayılan 100)", required: false },
    ],
  },
  async execute(interaction) {
    try {
      const max = interaction.options.getInteger("max") || 100;
      const result = Math.floor(Math.random() * max) + 1;
      await interaction.reply({ content: `🎲 Sonuç: **${result}** (1-${max})`, ephemeral: false });
    } catch (error) {
      const logger = require("../../utils/logger");
      logger.error(`[roll] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Zar atılamadı.", ephemeral: true });
    }
  },
};