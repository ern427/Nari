const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "warn",
    description: "Bir kullanıcıyı uyarır.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Uyarılacak kullanıcı.",
        required: true,
      },
      {
        name: "sebep",
        type: 3,
        description: "Uyarı sebebi.",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
    }

    if (!(await requireModerator(interaction))) return;

    const target = interaction.options.getMember("kullanici");
    const reason = interaction.options.getString("sebep");

    if (!target) {
      return interaction.reply({ content: "Kullanıcı sunucuda bulunamadı.", ephemeral: true });
    }

    // FIX: Guard against db not being initialized yet
    if (!interaction.client.db) {
      return interaction.reply({ content: "Veritabanı henüz hazır değil, lütfen tekrar deneyin.", ephemeral: true });
    }

    const createdAt = new Date().toISOString();

    try {
      // FIX: Use runAsync instead of a callback-wrapped Promise.
      // The old callback pattern had a race condition: sqlite.js calls the
      // callback synchronously, so resolve(this.lastID) fired inside the
      // same tick as the Promise constructor — fragile in some V8 builds.
      // runAsync() is the clean async wrapper already provided by the shim.
      await interaction.client.db.runAsync(
        "INSERT INTO warnings (guildId, userId, moderatorId, reason, createdAt) VALUES (?, ?, ?, ?, ?)",
        [interaction.guild.id, target.id, interaction.user.id, reason, createdAt],
      );
    } catch (error) {
      return interaction.reply({ content: "Uyarı kaydedilirken bir hata oluştu.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor("#F04747")
      .setTitle("Kullanıcı Uyarıldı")
      .setDescription(`${target.user.tag} başarıyla uyarıldı.`)
      .addFields(
        { name: "Hedef", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Yetkili", value: `${interaction.user.tag}`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Warn",
      target: `${target.user.tag} (${target.id})`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason,
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
