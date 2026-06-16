const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "moveme",
    description: "Seni seçtiğin ses kanalına taşır.",
    options: [{ name: "ses-kanali", type: 7, description: "Hedef ses kanalı", required: true }],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      if (!(await requireModerator(interaction))) return;

      const channel = interaction.options.getChannel("ses-kanali");
      if (!channel || channel.type !== ChannelType.GuildVoice) return interaction.reply({ content: "Lütfen geçerli bir ses kanalı seçin.", ephemeral: true });

      // Ensure we have a fresh GuildMember with voice state
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);

      logger.info(`[VOICE DEBUG] MoveMe command - User: ${member.user.tag} (${member.id}) VoiceChannel: ${member.voice?.channel ? 'yes' : 'no'} VoiceChannelID: ${member.voice?.channel?.id || 'none'} VoiceChannelName: ${member.voice?.channel?.name || 'none'}`);

      if (!member.voice || !member.voice.channel) return interaction.reply({ content: "Önce bir ses kanalında olmalısın.", ephemeral: true });

      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
        return interaction.reply({ content: "Botun kullanıcıları taşımak için gerekli `Move Members` yetkisi yok.", ephemeral: true });
      }

      await member.voice.setChannel(channel.id);
      await interaction.reply({ content: `✅ Seni ${channel} kanalına taşıdım.`, ephemeral: true });

      const embed = buildModerationEmbed({
        action: "MoveMe",
        target: `${member.user.tag} (${member.id})`,
        moderator: `${interaction.user.tag} (${interaction.user.id})`,
        reason: `Kullanıcı kendi isteğiyle taşındı: ${channel.name}`,
        guild: interaction.guild,
      });

      await sendModerationLog(interaction, embed);
    } catch (error) {
      logger.error(`[moveme] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Taşıma işlemi sırasında bir hata oluştu.", ephemeral: true });
    }
  },
};