const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const logger = require("./logger");

const logColors = {
  message: "#5865F2",
  member: "#57F287",
  role: "#F04747",
  moderation: "#ED4245",
  channel: "#FAA61A",
};

const getLogChannel = async (guild, db) => {
  try {
    const row = await db.getAsync("SELECT logChannelId FROM log_settings WHERE guildId = ?", [guild.id]);
    if (!row?.logChannelId) return null;

    try {
      const channel = await guild.channels.fetch(row.logChannelId);
      if (
        channel &&
        channel.type === ChannelType.GuildText &&
        channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
      ) {
        return channel;
      }
    } catch (error) {
      logger.error(`[getLogChannel] ${error.message}`);
    }

    return null;
  } catch (error) {
    logger.error(`[getLogChannel] ${error.message}`);
    return null;
  }
};

const sendLog = async (guild, embed, db) => {
  try {
    const logChannel = await getLogChannel(guild, db);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] }).catch((error) => {
      logger.error(`[sendLog] ${error.message}`);
    });
  } catch (error) {
    logger.error(`[sendLog] ${error.message}`);
  }
};

const buildMessageLog = (type, message, oldMessage = null) => {
  const embed = new EmbedBuilder()
    .setColor(logColors.message)
    .setTitle(type === "delete" ? "Mesaj Silindi" : "Mesaj Düzenlendi")
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `Kullanıcı ID: ${message.author.id} • Mesaj ID: ${message.id}` })
    .setTimestamp();

  embed.addFields(
    { name: "Kanal", value: `${message.channel}`, inline: true },
    { name: "Yazar", value: `${message.author}`, inline: true },
  );

  if (type === "delete") {
    const content = message.content || "(Embed veya dosya)";
    embed.addFields({ name: "Silinen Mesaj", value: content.substring(0, 1024), inline: false });
  } else if (type === "edit" && oldMessage) {
    const oldContent = oldMessage.content || "(Embed veya dosya)";
    const newContent = message.content || "(Embed veya dosya)";
    embed.addFields(
      { name: "Eski Mesaj", value: oldContent.substring(0, 512), inline: false },
      { name: "Yeni Mesaj", value: newContent.substring(0, 512), inline: false },
    );
  }

  return embed;
};

const buildMemberLog = (type, member) => {
  const embed = new EmbedBuilder()
    .setColor(logColors.member)
    .setTitle(type === "join" ? "Üye Katıldı" : "Üye Ayrıldı")
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `Kullanıcı ID: ${member.id}` })
    .setTimestamp();

  if (type === "join") {
    embed.addFields(
      { name: "Kullanıcı", value: `${member}`, inline: true },
      { name: "Hesap Oluşturma", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Üye Sayısı", value: `${member.guild.memberCount}`, inline: true },
    );
  } else {
    embed.addFields(
      { name: "Kullanıcı", value: `${member.user.tag}`, inline: true },
      { name: "Katılma", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Bilinmiyor", inline: true },
      { name: "Üye Sayısı", value: `${member.guild.memberCount}`, inline: true },
    );
  }

  return embed;
};

const buildRoleLog = (type, member, role, moderator = null) => {
  const embed = new EmbedBuilder()
    .setColor(logColors.role)
    .setTitle(type === "add" ? "Rol Verildi" : "Rol Alındı")
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `Kullanıcı ID: ${member.id}` })
    .setTimestamp();

  embed.addFields(
    { name: "Hedef", value: `${member}`, inline: true },
    { name: "Rol", value: `${role}`, inline: true },
    { name: "İşlem", value: type === "add" ? "Verildi" : "Alındı", inline: true },
  );

  if (moderator) {
    embed.addFields({ name: "Yetkili", value: `${moderator}`, inline: true });
  }

  return embed;
};

const buildModerationLog = ({ action, target, moderator, reason, details, guild }) => {
  const embed = new EmbedBuilder()
    .setColor(logColors.moderation)
    .setTitle("Moderasyon Kaydı")
    .setFooter({ text: `${guild.name} • ${guild.id}` })
    .setTimestamp();

  embed.addFields(
    { name: "İşlem", value: action, inline: true },
    { name: "Hedef", value: target, inline: true },
    { name: "Yetkili", value: moderator, inline: true },
    { name: "Sebep", value: reason || "Belirtilmedi", inline: false },
  );

  if (details?.length) {
    details.forEach((detail) => {
      embed.addFields({ name: detail.name, value: detail.value, inline: detail.inline ?? false });
    });
  }

  return embed;
};

const buildChannelLog = (type, channel, moderator = null, reason = null) => {
  let title = "Kanal";
  let color = logColors.channel;

  if (type === "lock") title = "Kanal Kilitlendi";
  else if (type === "unlock") title = "Kanal Açıldı";
  else if (type === "ticket_open") title = "🎫 Ticket Açıldı";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setFooter({ text: `Kanal ID: ${channel.id}` })
    .setTimestamp();

  embed.addFields(
    { name: "Kanal", value: `${channel}`, inline: true },
    { name: "İşlem", value: type === "lock" ? "Kilitlendi" : type === "unlock" ? "Açıldı" : "Açıldı", inline: true },
  );

  if (moderator) {
    embed.addFields({ name: "İşlem Yapan", value: `${moderator}`, inline: true });
  }

  if (reason) {
    embed.addFields({ name: "Sebep", value: reason, inline: false });
  }

  return embed;
};

module.exports = {
  getLogChannel,
  sendLog,
  buildMessageLog,
  buildMemberLog,
  buildRoleLog,
  buildModerationLog,
  buildChannelLog,
  logColors,
};
