const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Özel embed mesaj oluşturur.")
    .addStringOption((option) =>
      option.setName("baslik").setDescription("Embed başlığı.").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("aciklama").setDescription("Embed açıklaması.").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("renk").setDescription("Embed rengi (hex kodu, örn: #5865F2)").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("footer").setDescription("Embed footer metni.").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("thumbnail").setDescription("Embed thumbnail URL'si.").setRequired(false),
    ),
  async execute(interaction) {
    try {
      if (!(await requireModerator(interaction))) return;

      const title = interaction.options.getString("baslik");
      const description = interaction.options.getString("aciklama");
      const color = interaction.options.getString("renk") || "#5865F2";
      const footer = interaction.options.getString("footer");
      const thumbnail = interaction.options.getString("thumbnail");

      const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();

      if (footer) embed.setFooter({ text: footer });
      if (thumbnail) embed.setThumbnail(thumbnail);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`[embed] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Embed oluşturulurken bir hata oluştu.", ephemeral: true });
    }
  },
};