const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "unlock",
    description: "Kanal kilidini açar ve @everyone için mesaj yazmayı tekrar etkinleştirir.",
  },
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
    }

    if (!(await requireModerator(interaction))) return;

    const channel = interaction.channel;
    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "Kanal izinleri düzenlenemiyor.", ephemeral: true });
    }

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("Kanal Açıldı")
      .setDescription(`${channel} kanalı artık yeniden yazılabilir.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Unlock",
      target: `${channel.name}`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason: "Kanal kilidi açıldı",
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
