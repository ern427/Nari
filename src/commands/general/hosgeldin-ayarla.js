const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");
const { setWelcomeSettings } = require("../../utils/settingsManager");

module.exports = {
  data: {
    name: "hosgeldin-ayarla",
    description: "Karşılama sistemini ayarlar.",
    options: [
      {
        name: "kanal",
        type: 7,
        description: "Karşılama mesajının gönderileceği kanal.",
        required: true,
      },
      {
        name: "embed_baslik",
        type: 3,
        description: "Karşılama embed başlığı.",
        required: false,
      },
      {
        name: "embed_aciklama",
        type: 3,
        description: "Karşılama embed açıklaması.",
        required: false,
      },
      {
        name: "renk",
        type: 3,
        description: "Embed rengi (hex kodu).",
        required: false,
      },
      {
        name: "footer",
        type: 3,
        description: "Embed footer metni.",
        required: false,
      },
      {
        name: "thumbnail",
        type: 3,
        description: "Embed thumbnail URL'si.",
        required: false,
      },
      {
        name: "dm_mesaj",
        type: 3,
        description: "Yeni üyeye DM olarak gönderilecek mesaj.",
        required: false,
      },
      {
        name: "kurallar_mesaj",
        type: 3,
        description: "Yeni üyeye gösterilecek sunucu kuralları mesajı.",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireModerator(interaction))) return;

      const channel = interaction.options.getChannel("kanal");
      if (!channel) {
        return interaction.reply({ content: "Lütfen geçerli bir kanal seçin.", ephemeral: true });
      }

      const settings = {
        channelId: channel.id,
        enabled: true,
        welcomeMessage: null,
        dmMessage: interaction.options.getString("dm_mesaj") || null,
        rulesMessage: interaction.options.getString("kurallar_mesaj") || null,
        embedTitle: interaction.options.getString("embed_baslik") || null,
        embedDescription: interaction.options.getString("embed_aciklama") || null,
        embedColor: interaction.options.getString("renk") || "#5865F2",
        footerText: interaction.options.getString("footer") || null,
        thumbnailURL: interaction.options.getString("thumbnail") || null,
      };

      await setWelcomeSettings(interaction.guild.id, settings, interaction.client.db);

      const embed = new EmbedBuilder()
        .setColor(settings.embedColor)
        .setTitle("✅ Karşılama ayarlandı")
        .setDescription(`Karşılama kanalı: ${channel}`)
        .addFields(
          { name: "DM Mesaj", value: settings.dmMessage ? "Açık" : "Kapalı", inline: true },
          { name: "Kurallar Mesajı", value: settings.rulesMessage ? "Açık" : "Kapalı", inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`[hosgeldin-ayarla] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Karşılama ayarlanırken bir hata oluştu.", ephemeral: true });
    }
  },
};