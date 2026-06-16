const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "untimeout",
    description: "Bir kullanıcıya verilen timeout süresini kaldırır.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Timeout'u kaldırılacak kullanıcı.",
        required: true,
      },
      {
        name: "sebep",
        type: 3,
        description: "Timeout kaldırma sebebi.",
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
    const reason = interaction.options.getString("sebep") || "Belirtilmedi";

    if (!target) {
      return interaction.reply({ content: "Kullanıcı sunucuda bulunamadı.", ephemeral: true });
    }

    if (!target.communicationDisabledUntil || target.communicationDisabledUntilTimestamp <= Date.now()) {
      return interaction.reply({ content: "Bu kullanıcıda aktif bir timeout bulunmuyor.", ephemeral: true });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: "Bu kullanıcı için timeout kaldırma işlemi yapılamıyor.", ephemeral: true });
    }

    await target.timeout(null, `${interaction.user.tag} | ${reason}`);

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("Timeout Kaldırıldı")
      .setDescription(`${target.user.tag} için timeout kaldırıldı.`)
      .addFields(
        { name: "Hedef", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Yetkili", value: `${interaction.user.tag}`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Untimeout",
      target: `${target.user.tag} (${target.id})`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason,
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
