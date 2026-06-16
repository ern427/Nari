const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { getSecuritySettings, updateSecuritySetting } = require("../../utils/settingsManager");

const validSystems = [
  { name: "anti_spam", label: "Anti Spam", field: "antiSpam" },
  { name: "anti_flood", label: "Anti Flood", field: "antiFlood" },
  { name: "anti_mention_spam", label: "Anti Mention Spam", field: "antiMentionSpam" },
  { name: "anti_raid", label: "Anti Raid", field: "antiRaid" },
  { name: "anti_bot", label: "Anti Bot", field: "antiBot" },
  { name: "anti_mass_join", label: "Anti Mass Join", field: "antiMassJoin" },
];

const getSystemLabel = (name) => {
  return validSystems.find((item) => item.name === name)?.label || name;
};

const getSystemField = (name) => {
  return validSystems.find((item) => item.name === name)?.field;
};

module.exports = {
  data: {
    name: "guvenlik",
    description: "Sunucu güvenlik sistemlerini açıp kapatır.",
    options: [
      {
        name: "sistem",
        type: 3,
        description: "Ayarını değiştireceğiniz güvenlik sistemi.",
        required: true,
        choices: validSystems.map((item) => ({ name: item.label, value: item.name })),
      },
      {
        name: "durum",
        type: 3,
        description: "Sistemi açmak veya kapatmak için seçim.",
        required: true,
        choices: [
          { name: "Aç", value: "ac" },
          { name: "Kapat", value: "kapat" },
        ],
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      const system = interaction.options.getString("sistem");
      const status = interaction.options.getString("durum");
      const field = getSystemField(system);

      if (!field) {
        return interaction.reply({ content: "Geçersiz güvenlik sistemi seçimi.", ephemeral: true });
      }

      const enabled = status === "ac";
      await updateSecuritySetting(interaction.guild.id, field, enabled, interaction.client.db);

      return interaction.reply({ content: `✅ ${getSystemLabel(system)} artık ${enabled ? "aktif" : "pasif"}.`, ephemeral: true });
    } catch (error) {
      logger.error(`[guvenlik] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Güvenlik ayarı güncellenirken bir hata oluştu.", ephemeral: true });
    }
  },
};