const { PermissionFlagsBits } = require("discord.js");
const { requireModerator } = require("../../utils/permissionHandler");
const { buildModerationEmbed, sendModerationLog } = require("../../utils/moderationLogger");
const logger = require("../../utils/logger");

module.exports = {
  data: {
    name: "vmute",
    description: "Kullanıcıyı sesli kanallarda susturur.",
    options: [
      { name: "kullanici", type: 6, description: "Susturulacak kullanıcı", required: true },
      { name: "sebep", type: 3, description: "Susturma sebebi", required: false },
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

      logger.info(`[VOICE DEBUG] VMute command - User: ${target.user.tag} (${target.id}) VoiceChannel: ${target.voice?.channel ? 'yes' : 'no'} VoiceChannelID: ${target.voice?.channel?.id || 'none'} VoiceChannelName: ${target.voice?.channel?.name || 'none'}`);

      if (!target.voice || !target.voice.channel) return interaction.reply({ content: "Kullanıcı şu anda herhangi bir ses kanalında değil.", ephemeral: true });

      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return interaction.reply({ content: "Botun kullanıcıları sunucuda susturmak için `Mute Members` yetkisi yok.", ephemeral: true });
      }

      await target.voice.setMute(true, reason).catch(() => null);

      await interaction.reply({ content: `🔇 ${target} kullanıcısı sesli kanallarda susturuldu. Sebep: ${reason}`, ephemeral: true });

      const embed = buildModerationEmbed({
        action: "VMute",
        target: `${target.user.tag} (${target.id})`,
        moderator: `${interaction.user.tag} (${interaction.user.id})`,
        reason,
        guild: interaction.guild,
      });

      await sendModerationLog(interaction, embed);
    } catch (error) {
      logger.error(`[vmute] ${error.stack || error.message || error}`);
      return interaction.reply({ content: "Kullanıcı susturulurken bir hata oluştu.", ephemeral: true });
    }
  },
};