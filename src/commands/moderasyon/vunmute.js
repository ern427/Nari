const { PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "vunmute",
    description: "Kullanıcının ses susturmasını kaldırır.",
    options: [
      { name: "kullanici", type: 6, description: "Susturması kaldırılacak kullanıcı", required: true },
      { name: "sebep", type: 3, description: "Sebep", required: false },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.guild) return interaction.reply({ content: "Bu komut sadece sunucularda kullanılabilir.", ephemeral: true });
      if (!(await requireModerator(interaction))) return;

      const userOption = interaction.options.getUser("kullanici");
      const reason = interaction.options.getString("sebep") || "Belirtilmedi";

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

      logger.info(`[VOICE DEBUG] VUnmute command - User: ${target.user.tag} (${target.id}) VoiceChannel: ${target.voice?.channel ? 'yes' : 'no'} VoiceChannelID: ${target.voice?.channel?.id || 'none'} VoiceChannelName: ${target.voice?.channel?.name || 'none'}`);

      if (!target.voice || !target.voice.channel) return interaction.reply({ content: "Kullanıcı şu anda herhangi bir ses kanalında değil.", ephemeral: true });

      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return interaction.reply({ content: "Botun kullanıcıları sunucuda susturmayı kaldırmak için `Mute Members` yetkisi yok.", ephemeral: true });
      }

      await target.voice.setMute(false, reason).catch(() => null);

      await interaction.reply({ content: `🔊 ${target} kullanıcısının ses susturması kaldırıldı. Sebep: ${reason}`, ephemeral: true });

      const embed = buildModerationEmbed({
        action: "VUnmute",
        target: `${target.user.tag} (${target.id})`,
        moderator: `${interaction.user.tag} (${interaction.user.id})`,
        reason,
        guild: interaction.guild,
      });

      await sendModerationLog(interaction, embed);
    } catch (error) {
      logger.error(`[vunmute] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Susturma kaldırılırken bir hata oluştu.", ephemeral: true });
    }
  },
};