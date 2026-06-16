const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");

module.exports = {
  data: {
    name: "lock",
    description: "Kanalı kitler ve @everyone için mesaj yazmayı engeller.",
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
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor("#ED4245")
      .setTitle("Kanal Kilitlendi")
      .setDescription(`${channel} kanalı kilitlendi.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmbed = buildModerationEmbed({
      action: "Lock",
      target: `${channel.name}`,
      moderator: `${interaction.user.tag} (${interaction.user.id})`,
      reason: "Kanal kilitlendi",
      guild: interaction.guild,
    });

    await sendModerationLog(interaction, logEmbed);
  },
};
