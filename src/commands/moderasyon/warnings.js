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

      // FIX: Guard against db not being initialized yet
      if (!interaction.client.db) {
        return interaction.reply({ content: "Veritabanı henüz hazır değil, lütfen tekrar deneyin.", ephemeral: true });
      }

      await interaction.deferReply();

      // FIX: Use allAsync() — the clean async wrapper provided by sqlite.js shim.
      //
      // ROOT CAUSE of "db.all is not a function":
      //   sqlite.js patches .all() onto the db object instance inside
      //   attachSqlite3Compatibility(). If interaction.client.db was assigned
      //   (e.g. client.db = getDb()) BEFORE initializeDatabase() completed
      //   and called attachSqlite3Compatibility(), the stored reference points
      //   to the raw sql.js Database which has no .all() method.
      //
      //   Using allAsync() is the same fix AND is cleaner: no need to wrap
      //   in `new Promise()` manually — that wrapper had its own bug where
      //   sqlite.js invokes the callback synchronously, making resolve() fire
      //   inside the Promise constructor before .then() chains could attach.
      const warnings = await interaction.client.db.allAsync(
        "SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY createdAt DESC",
        [interaction.guild.id, target.id],
      );

      // allAsync returns [] on no rows (the shim initialises rows = [])
      if (!warnings || warnings.length === 0) {
        return interaction.editReply({
          content: `${target.user.tag} kullanıcısının uyarı kaydı bulunamadı.`,
        });
      }

      const pageSize = 3;
      const totalPages = Math.ceil(warnings.length / pageSize);
      const page = 0;

      const embed = buildWarningsEmbed(target, warnings, page, pageSize, totalPages);
      const row = buildPaginationRow(target.id, page, totalPages);

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

// FIX: Extract embed/row builders so the pagination button handler
// (wherever it lives in your project) can reuse them without duplicating logic.
// If you handle warnings_previous / warnings_next in a separate interactionCreate
// handler, import these helpers from this file.
function buildWarningsEmbed(target, warnings, page, pageSize, totalPages) {
  return new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle(`${target.user.tag} Uyarı Geçmişi`)
    .setDescription(`Toplam uyarı: ${warnings.length}`)
    .addFields(
      warnings.slice(page * pageSize, (page + 1) * pageSize).map((warning, index) => ({
        name: `${page * pageSize + index + 1}. Uyarı`,
        value: `**Sebep:** ${warning.reason}\n**Yetkili:** <@${warning.moderatorId}>\n**Tarih:** ${new Date(warning.createdAt).toLocaleString("tr-TR")}`,
      })),
    )
    .setFooter({ text: `Sayfa ${page + 1}/${totalPages}` })
    .setTimestamp();
}

function buildPaginationRow(targetId, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`warnings_previous_${targetId}_${page}`)
      .setLabel("Önceki")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`warnings_next_${targetId}_${page}`)
      .setLabel("Sonraki")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

module.exports.buildWarningsEmbed = buildWarningsEmbed;
module.exports.buildPaginationRow = buildPaginationRow;
