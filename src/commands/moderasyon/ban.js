const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "ban",
    description: "Bir kullanıcıyı sunucudan yasaklar.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Yasaklanacak kullanıcı.",
        required: true,
      },
      {
        name: "sebep",
        type: 3,
        description: "Ban sebebi.",
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

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "Kendini banlayamazsın.", ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({ content: "Botu banlayamazsın.", ephemeral: true });
    }

    if (target.id === interaction.guild.ownerId) {
      return interaction.reply({ content: "Sunucu sahibini banlayamazsın.", ephemeral: true });
    }

    if (
      target.roles.highest.position >= interaction.member.roles.highest.position &&
      interaction.guild.ownerId !== interaction.member.id
    ) {
      return interaction.reply({ content: "Bu kullanıcıya karşı yeterli yetkiniz yok.", ephemeral: true });
    }

    if (!target.bannable) {
      return interaction.reply({ content: "Bu kullanıcıyı banlayamıyorum.", ephemeral: true });
    }

    await interaction.guild.members.ban(target.user.id, { reason: `${interaction.user.tag} | ${reason}` });

    const embed = new EmbedBuilder()
      .setColor("#ED4245")
      .setTitle("Kullanıcı Banlandı")
      .setDescription(`${target.user.tag} başarıyla banlandı.`)
      .addFields(
        { name: "Hedef", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Yetkili", value: `${interaction.user.tag}`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Ban",
      target: `${target.user.tag} (${target.id})`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason,
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
