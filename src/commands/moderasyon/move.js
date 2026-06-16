const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "move",
    description: "Belirtilen kullanıcıyı seçilen ses kanalına taşır.",
    options: [
      { name: "kullanici", type: 6, description: "Taşınacak kullanıcı", required: true },
      { name: "ses-kanali", type: 7, description: "Hedef ses kanalı", required: true },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      if (!(await requireModerator(interaction))) return;

      const userOption = interaction.options.getUser("kullanici");
      const channel = interaction.options.getChannel("ses-kanali");

      let target = null;
      if (userOption && interaction.guild) {
        try {
          target = await interaction.guild.members.fetch(userOption.id);
        } catch (err) {
          target = interaction.options.getMember("kullanici");
        }
      } else {
        target = interaction.options.getMember("kullanici");
      }

      if (!target) return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });
      if (!channel || channel.type !== ChannelType.GuildVoice) return interaction.reply({ content: "Lütfen geçerli bir ses kanalı seçin.", ephemeral: true });

      logger.info(`[VOICE DEBUG] Move command - User: ${target.user.tag} (${target.id}) VoiceChannel: ${target.voice?.channel ? 'yes' : 'no'} VoiceChannelID: ${target.voice?.channel?.id || 'none'} VoiceChannelName: ${target.voice?.channel?.name || 'none'}`);

      if (!target.voice || !target.voice.channel) return interaction.reply({ content: "Kullanıcı şu anda herhangi bir ses kanalında değil.", ephemeral: true });

      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
        return interaction.reply({ content: "Botun kullanıcıları taşımak için gerekli `Move Members` yetkisi yok.", ephemeral: true });
      }

      await target.voice.setChannel(channel.id);

      await interaction.reply({ content: `✅ ${target} kullanıcısı başarıyla ${channel} kanalına taşındı.`, ephemeral: true });

      const embed = buildModerationEmbed({
        action: "Move",
        target: `${target.user.tag} (${target.id})`,
        moderator: `${interaction.user.tag} (${interaction.user.id})`,
        reason: `Taşındı: ${channel.name}`,
        guild: interaction.guild,
      });

      await sendModerationLog(interaction, embed);
    } catch (error) {
      logger.error(`[move] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Kullanıcı taşınırken bir hata oluştu.", ephemeral: true });
    }
  },
};