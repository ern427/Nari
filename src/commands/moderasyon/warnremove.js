const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "warnremove",
    description: "Bir kullanıcının belirli uyarısını veya tüm uyarılarını kaldır.",
    options: [
      { name: "kullanici", type: 6, description: "Uyarıları kaldırılacak kullanıcı", required: true },
      { name: "warn-id", type: 3, description: "Kaldırılacak uyarı ID'si (isteğe bağlı)", required: false },
      { name: "hepsini-sil", type: 5, description: "Tüm uyarıları sil (true/false)", required: false },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      if (!(await requireModerator(interaction))) return;

      const user = interaction.options.getUser("kullanici");
      const warnId = interaction.options.getString("warn-id");
      const deleteAll = interaction.options.getBoolean("hepsini-sil") || false;

      if (!user) return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });

      const db = interaction.client.db;

      if (deleteAll) {
        await new Promise((resolve, reject) => {
          db.run("DELETE FROM warnings WHERE guildId = ? AND userId = ?", [interaction.guild.id, user.id], function (err) {
            if (err) return reject(err);
            resolve(this.changes || 0);
          });
        });

        await interaction.reply({ content: `✅ ${user.tag} kullanıcısının tüm uyarıları silindi.`, ephemeral: true });

        const embed = buildModerationEmbed({
          action: "WarnRemoveAll",
          target: `${user.tag} (${user.id})`,
          moderator: `${interaction.user.tag} (${interaction.user.id})`,
          reason: "Tüm uyarılar silindi",
          guild: interaction.guild,
        });

        await sendModerationLog(interaction, embed);
        return;
      }

      if (warnId) {
        await new Promise((resolve, reject) => {
          db.run("DELETE FROM warnings WHERE id = ? AND guildId = ? AND userId = ?", [warnId, interaction.guild.id, user.id], function (err) {
            if (err) return reject(err);
            resolve(this.changes || 0);
          });
        });

        await interaction.reply({ content: `✅ Belirtilen uyarı silindi (ID: ${warnId}).`, ephemeral: true });

        const embed = buildModerationEmbed({
          action: "WarnRemove",
          target: `${user.tag} (${user.id})`,
          moderator: `${interaction.user.tag} (${interaction.user.id})`,
          reason: `Uyarı ID: ${warnId} silindi`,
          guild: interaction.guild,
        });

        await sendModerationLog(interaction, embed);
        return;
      }

      return interaction.reply({ content: "Lütfen bir warn-id belirtin veya 'hepsini-sil' seçeneğini kullanın.", ephemeral: true });
    } catch (error) {
      logger.error(`[warnremove] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Uyarı kaldırma sırasında bir hata oluştu.", ephemeral: true });
    }
  },
};