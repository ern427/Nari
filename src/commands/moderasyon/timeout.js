const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");
const { parseDuration, formatDuration } = require("../../utils/timeParser");

const MAX_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  data: {
    name: "timeout",
    description: "Bir kullanıcıyı belirli süreyle susturur.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Susturulacak kullanıcı.",
        required: true,
      },
      {
        name: "sure",
        type: 3,
        description: "Süre (örnek: 10m, 1h, 1d).",
        required: true,
      },
      {
        name: "sebep",
        type: 3,
        description: "Susturma sebebi.",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
    }

    if (!(await requireModerator(interaction))) return;

    const target = interaction.options.getMember("kullanici");
    const durationString = interaction.options.getString("sure");
    const reason = interaction.options.getString("sebep") || "Belirtilmedi";

    if (!target) {
      return interaction.reply({ content: "Kullanıcı sunucuda bulunamadı.", ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "Kendini timeout'a alamazsın.", ephemeral: true });
    }

    if (target.id === interaction.guild.ownerId) {
      return interaction.reply({ content: "Sunucu sahibini timeout'a alamazsın.", ephemeral: true });
    }

    if (
      target.roles.highest.position >= interaction.member.roles.highest.position &&
      interaction.guild.ownerId !== interaction.member.id
    ) {
      return interaction.reply({ content: "Bu kullanıcıya karşı yeterli yetkiniz yok.", ephemeral: true });
    }

    const duration = parseDuration(durationString);
    if (!duration || duration > MAX_TIMEOUT) {
      return interaction.reply({ content: "Geçersiz süre. 1m ile 7d arasında bir süre giriniz.", ephemeral: true });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: "Bu kullanıcıyı timeout'a alamıyorum.", ephemeral: true });
    }

    await target.timeout(duration, `${interaction.user.tag} | ${reason}`);

    const embed = new EmbedBuilder()
      .setColor("#F04747")
      .setTitle("Kullanıcı Timeoutlandı")
      .setDescription(`${target.user.tag} başarıyla timeoutlandı.`)
      .addFields(
        { name: "Süre", value: formatDuration(duration), inline: true },
        { name: "Hedef", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Timeout",
      target: `${target.user.tag} (${target.id})`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason,
      details: [{ name: "Süre", value: formatDuration(duration), inline: true }],
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
