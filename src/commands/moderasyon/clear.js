const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "clear",
    description: "Belirtilen miktarda mesaj siler.",
    options: [
      {
        name: "miktar",
        type: 4,
        description: "Silinecek mesaj sayısı (1-100).",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
    }

    if (!(await requireModerator(interaction))) return;

    const amount = interaction.options.getInteger("miktar");
    if (!amount || amount < 1 || amount > 100) {
      return interaction.reply({ content: "Lütfen 1 ile 100 arasında bir sayı girin.", ephemeral: true });
    }

    const fetched = await interaction.channel.messages.fetch({ limit: amount + 1 }).catch(() => null);
    if (!fetched) {
      return interaction.reply({ content: "Mesajlar alınırken bir hata oluştu.", ephemeral: true });
    }

    const messages = fetched.filter((msg) => msg.id !== interaction.id);
    const deleted = await interaction.channel.bulkDelete(messages, true).catch(() => null);

    if (!deleted) {
      return interaction.reply({ content: "Mesajlar silinirken bir hata oluştu veya mesajlar çok eski.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Mesajlar Silindi")
      .setDescription(`${deleted.size} mesaj silindi.`)
      .addFields(
        { name: "Yetkili", value: `${interaction.user.tag}`, inline: true },
        { name: "Kanal", value: `${interaction.channel}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    const logEmbed = buildModerationEmbed({
      action: "Clear",
      target: `${interaction.channel.name}`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason: `${deleted.size} mesaj silindi`,
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
