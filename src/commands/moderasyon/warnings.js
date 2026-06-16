const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "warnings",
    description: "Bir kullanıcının tüm uyarı geçmişini gösterir.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Uyarı geçmişi görüntülenecek kullanıcı.",
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

      const target = interaction.options.getMember("kullanici");
      if (!target) {
        return interaction.reply({ content: "Kullanıcı sunucuda bulunamadı.", ephemeral: true });
      }

      await interaction.deferReply();

      // Promise wrapper for SQLite to prevent hanging
      const warnings = await new Promise((resolve, reject) => {
        interaction.client.db.all(
          "SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY createdAt DESC",
          [interaction.guild.id, target.id],
          (error, rows) => {
            if (error) reject(error);
            else resolve(rows || []);
          },
        );
      });

      // No warnings case
      if (!warnings || warnings.length === 0) {
        return interaction.editReply({
          content: `${target.user.tag} kullanıcısının uyarı kaydı bulunamadı.`,
        });
      }

      const pageSize = 3;
      const totalPages = Math.ceil(warnings.length / pageSize);
      const page = 0;

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`${target.user.tag} Uyarı Geçmişi`)
        .setDescription(`Toplam uyarı: ${warnings.length}`)
        .addFields(
          warnings.slice(page * pageSize, (page + 1) * pageSize).map((warning, index) => ({
            name: `${page * pageSize + index + 1}. Uyarı`,
            value: `**Sebep:** ${warning.reason}\n**Yetkili:** <@${warning.moderatorId}>\n**Tarih:** ${new Date(warning.createdAt).toLocaleString()}`,
          })),
        )
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`warnings_previous_${target.id}_${page}`)
          .setLabel("Önceki")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`warnings_next_${target.id}_${page}`)
          .setLabel("Sonraki")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error(`[warnings] ${error.message || error}`);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: "Uyarılar getirilirken bir hata oluştu.",
        });
      }

      return interaction.reply({
        content: "Uyarılar getirilirken bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
