const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "yardim",
    description: "Sunucuda kullanılabilir komut kategorilerini gösterir.",
  },
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Yardım Menüsü")
      .setDescription("Aşağıdaki menüden kategori seçerek komut açıklamalarını görüntüleyebilirsin.")
      .addFields({ name: "Kategoriler", value: "Genel Komutlar, Moderasyon, Ticket, Güvenlik, Eğlence" })
      .setTimestamp()
      .setFooter({ text: "Nari Yardım Sistemi" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help-category-select")
        .setPlaceholder("Kategori seç...")
        .addOptions([
          { label: "Genel Komutlar", value: "genel", description: "Genel komutları görüntüle" },
          { label: "Moderasyon", value: "moderasyon", description: "Moderasyon komutları" },
          { label: "Ticket", value: "ticket", description: "Ticket komutları" },
          { label: "Güvenlik", value: "guvenlik", description: "Güvenlik komutları" },
          { label: "Yönetim", value: "performans", description: "Yönetim ve istatistik komutları" },
          { label: "Eğlence", value: "eglence", description: "Eğlence komutları" },
        ]),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
