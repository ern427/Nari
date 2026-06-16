const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

const validValues = [0, 5, 10, 30, 60];

module.exports = {
  data: {
    name: "slowmode",
    description: "Kanalda slowmode ayarlar.",
    options: [
      {
        name: "sure",
        type: 4,
        description: "Slowmode süresi (0, 5, 10, 30, 60).",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
    }

    if (!(await requireModerator(interaction))) return;

    const channel = interaction.channel;
    const duration = interaction.options.getInteger("sure");

    if (!validValues.includes(duration)) {
      return interaction.reply({ content: "Geçerli slowmode değerleri: 0, 5, 10, 30, 60.", ephemeral: true });
    }

    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "Kanal izinleri düzenlenemiyor.", ephemeral: true });
    }

    await channel.setRateLimitPerUser(duration);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Slowmode Ayarlandı")
      .setDescription(`${channel} kanalı için slowmode ${duration} saniye olarak ayarlandı.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Slowmode",
      target: `${channel.name}`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason: `${duration} saniye`, 
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
