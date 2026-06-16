const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const logger = require("./logger");

const buildModerationEmbed = ({ action, target, moderator, reason, details, guild }) => {
  const embed = new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle("Moderasyon Kaydı")
    .addFields(
      { name: "İşlem", value: action, inline: true },
      { name: "Hedef", value: target, inline: true },
      { name: "Yetkili", value: moderator, inline: true },
      { name: "Sebep", value: reason || "Belirtilmedi", inline: false },
    )
    .setTimestamp();

  if (details?.length) {
    details.forEach((detail) => {
      embed.addFields({ name: detail.name, value: detail.value, inline: detail.inline ?? false });
    });
  }

  if (guild) {
    embed.setFooter({ text: `${guild.name} • ${guild.id}` });
  }

  return embed;
};

const getLogChannelFromSettings = (guild, db) => {
  return new Promise((resolve) => {
    db.get("SELECT logChannelId FROM log_settings WHERE guildId = ?", [guild.id], async (error, row) => {
      if (error) {
        logger.error(`[getLogChannelFromSettings] ${error.message}`);
        resolve(null);
        return;
      }

      if (!row || !row.logChannelId) {
        resolve(null);
        return;
      }

      try {
        const channel = await guild.channels.fetch(row.logChannelId);
        if (
          channel &&
          channel.type === ChannelType.GuildText &&
          channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
        ) {
          resolve(channel);
        } else {
          resolve(null);
        }
      } catch (error) {
        logger.error(`[getLogChannelFromSettings] ${error.message}`);
        resolve(null);
      }
    });
  });
};

const findModerationLogChannel = (guild) => {
  if (!guild || !guild.channels) return null;
  return guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.viewable &&
      channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages) &&
      /(mod(erasyon)?|log)/i.test(channel.name),
  );
};

const sendModerationLog = async (interaction, embed) => {
  try {
    // Try to get log channel from settings first
    const logChannelFromSettings = await getLogChannelFromSettings(interaction.guild, interaction.client.db);
    if (logChannelFromSettings) {
      await logChannelFromSettings.send({ embeds: [embed] }).catch(() => null);
      return;
    }

    // Fallback to finding moderation channel by name
    const logChannel = findModerationLogChannel(interaction.guild);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  } catch (error) {
    logger.error(`[sendModerationLog] ${error.message}`);
  }
};

module.exports = {
  buildModerationEmbed,
  sendModerationLog,
};
