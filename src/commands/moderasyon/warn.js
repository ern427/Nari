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

    const createdAt = new Date().toISOString();
    const insertWarning = () =>
      new Promise((resolve, reject) => {
        interaction.client.db.run(
          "INSERT INTO warnings (guildId, userId, moderatorId, reason, createdAt) VALUES (?, ?, ?, ?, ?)",
          [interaction.guild.id, target.id, interaction.user.id, reason, createdAt],
          function (error) {
            if (error) return reject(error);
            resolve(this.lastID);
          },
        );
      });

    try {
      await insertWarning();
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
