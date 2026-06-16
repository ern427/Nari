const { EmbedBuilder } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "kick",
    description: "Bir kullanıcıyı sunucudan atar.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Atılacak kullanıcı.",
        required: true,
      },
      {
        name: "sebep",
        type: 3,
        description: "Atma sebebi.",
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
      return interaction.reply({ content: "Kendini atamazsın.", ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({ content: "Botu atamazsın.", ephemeral: true });
    }

    if (target.id === interaction.guild.ownerId) {
      return interaction.reply({ content: "Sunucu sahibini atamazsın.", ephemeral: true });
    }

    if (
      target.roles.highest.position >= interaction.member.roles.highest.position &&
      interaction.guild.ownerId !== interaction.member.id
    ) {
      return interaction.reply({ content: "Bu kullanıcıya karşı yeterli yetkiniz yok.", ephemeral: true });
    }

    if (!target.kickable) {
      return interaction.reply({ content: "Bu kullanıcıyı atamıyorum.", ephemeral: true });
    }

    await target.kick(`${interaction.user.tag} | ${reason}`);

    const embed = new EmbedBuilder()
      .setColor("#FAA61A")
      .setTitle("Kullanıcı Atıldı")
      .setDescription(`${target.user.tag} sunucudan atıldı.`)
      .addFields(
        { name: "Hedef", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Yetkili", value: `${interaction.user.tag}`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Kick",
      target: `${target.user.tag} (${target.id})`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason,
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
