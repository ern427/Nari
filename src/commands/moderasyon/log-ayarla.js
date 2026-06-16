const { EmbedBuilder, ChannelType } = require("discord.js");
const { requireAdmin } = require("../../utils/permissionHandler");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "log-ayarla",
    description: "Log kanalını ayarlar.",
    options: [
      {
        name: "kanal",
        type: 7,
        description: "Log kaydedilecek kanal.",
        required: true,
        channel_types: [ChannelType.GuildText],
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      }

      if (!(await requireAdmin(interaction))) return;

      const logChannel = interaction.options.getChannel("kanal");

      if (!logChannel || logChannel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "Geçerli bir metin kanalı seçiniz.", ephemeral: true });
      }

      const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
      if (!logChannel.permissionsFor(botMember).has("SendMessages")) {
        return interaction.reply({
          content: "Botun seçilen kanala mesaj gönderme izni yok.",
          ephemeral: true,
        });
      }

      const now = new Date().toISOString();

      // Promise wrapper for database operation
      const updateLogSettings = () =>
        new Promise((resolve, reject) => {
          interaction.client.db.run(
            `INSERT INTO log_settings (guildId, logChannelId, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?) 
             ON CONFLICT(guildId) DO UPDATE SET logChannelId = ?, updatedAt = ?`,
            [interaction.guild.id, logChannel.id, now, now, logChannel.id, now],
            function (error) {
              if (error) reject(error);
              else resolve(this.changes);
            },
          );
        });

      try {
        await updateLogSettings();
      } catch (error) {
        logger.error(`[log-ayarla] Veritabanı hatası: ${error.message}`);
        return interaction.reply({
          content: "Log ayarı kaydedilirken bir hata oluştu.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#57F287")
        .setTitle("Log Kanalı Ayarlandı")
        .setDescription(`Log kanalı başarıyla ${logChannel} olarak ayarlandı.`)
        .addFields(
          { name: "Kanal", value: `${logChannel}`, inline: true },
          { name: "Kanal ID", value: `${logChannel.id}`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Send test log
      const testEmbed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("Log Sistemi Aktif")
        .setDescription("Bu kanal artık tüm sunucu loglarını alacak.")
        .addFields(
          { name: "Mesaj Logları", value: "Silme ve düzenleme", inline: true },
          { name: "Üye Logları", value: "Giriş ve çıkış", inline: true },
          { name: "Rol Logları", value: "Verme ve alma", inline: true },
          { name: "Moderasyon", value: "Tüm işlemler", inline: true },
          { name: "Kanal", value: "Kilit ve açma", inline: true },
        )
        .setTimestamp();

      await logChannel.send({ embeds: [testEmbed] }).catch((error) => {
        logger.error(`[log-ayarla] Test log gönderilemedi: ${error.message}`);
      });
    } catch (error) {
      logger.error(`[log-ayarla] ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: "Bir hata oluştu.",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: "Bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
