const logger = require("./logger");
const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const TICKET_CATEGORIES = {
  destek: {
    label: "Destek",
    description: "Teknik destek için ticket aç",
    emoji: "🆘",
  },
  sikayet: {
    label: "Şikayet",
    description: "Bir şikayeti bildirmek için ticket aç",
    emoji: "📢",
  },
  yetkili: {
    label: "Yetkili Başvuru",
    description: "Yetkili olmak için başvur",
    emoji: "👤",
  },
  diger: {
    label: "Diğer",
    description: "Diğer konular için ticket aç",
    emoji: "📝",
  },
};

const generateTicketId = (guildTicketCount) => {
  return `TICKET-${String(guildTicketCount + 1).padStart(5, "0")}`;
};

const getNextTicketNumber = (guild, db) => {
  return new Promise((resolve) => {
    db.get("SELECT COUNT(*) as count FROM ticket_system WHERE guildId = ?", [guild.id], (error, row) => {
      if (error) {
        logger.error(`[getNextTicketNumber] ${error.message}`);
        resolve(1);
      } else {
        resolve((row?.count || 0) + 1);
      }
    });
  });
};

const getUserOpenTickets = (userId, guildId, db) => {
  return new Promise((resolve) => {
    db.all(
      "SELECT * FROM ticket_system WHERE ownerId = ? AND guildId = ? AND closedAt IS NULL",
      [userId, guildId],
      (error, rows) => {
        if (error) {
          logger.error(`[getUserOpenTickets] ${error.message}`);
          resolve([]);
        } else {
          resolve(rows || []);
        }
      },
    );
  });
};

const createTicket = async (guild, user, category, client) => {
  try {
    const ticketNumber = await getNextTicketNumber(guild, client.db);
    const ticketId = `ticket-${String(ticketNumber).padStart(4, "0")}`;

    // Get moderator role
    const moderatorRole = guild.roles.cache.find(
      (role) => role.name.toLowerCase().includes("moderator") || role.name.toLowerCase().includes("mod"),
    );

    // Create channel
    const channel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
        },
      ],
    });

    // Add moderator role if exists
    if (moderatorRole) {
      await channel.permissionOverwrites.create(moderatorRole, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
    }

    // Save to database
    await new Promise((resolve, reject) => {
      client.db.run(
        `INSERT INTO ticket_system (ticketId, guildId, channelId, ownerId, category, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ticketId, guild.id, channel.id, user.id, category, new Date().toISOString()],
        function (error) {
          if (error) reject(error);
          else resolve(this.lastID);
        },
      );
    });

    // Send welcome embed
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎫 Ticket Açıldı")
      .setDescription(`Hoşgeldin ${user}!\n\nTicket kategorisi: **${TICKET_CATEGORIES[category]?.label || category}**`)
      .addFields(
        { name: "Ticket ID", value: ticketId, inline: true },
        { name: "Tarih", value: new Date().toLocaleString("tr-TR"), inline: true },
      )
      .setFooter({ text: "Lütfen sorunu ayrıntılı bir şekilde açıklayın." });

    const ticketButtons = require("./ticketButtons");
    const row = ticketButtons.getTicketActionRow();

    await channel.send({
      content: `${user}`,
      embeds: [embed],
      components: [row],
    });

    return channel;
  } catch (error) {
    logger.error(`[createTicket] ${error.message}`);
    throw error;
  }
};

const getLogChannelIdForGuild = (guildId, db) => {
  return new Promise((resolve) => {
    db.get("SELECT logChannelId FROM log_settings WHERE guildId = ?", [guildId], (error, row) => {
      if (error) {
        logger.error(`[getLogChannelIdForGuild] ${error.message}`);
        return resolve(null);
      }
      resolve(row?.logChannelId || null);
    });
  });
};

const closeTicket = async (channel, closedBy, client, db) => {
  try {
    if (!channel || !channel.guild) {
      throw new Error("Geçersiz kanal bilgisi");
    }

    const ticket = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM ticket_system WHERE channelId = ?", [channel.id], (error, row) => {
        if (error) reject(error);
        else resolve(row);
      });
    });

    if (!ticket) {
      throw new Error("Ticket bulunamadı");
    }

    let transcript = null;
    try {
      const { createTranscript } = require("discord-html-transcripts");
      transcript = await createTranscript(channel, {
        limit: -1,
        returnBuffer: true,
        fileName: `${ticket.ticketId}.html`,
      });
    } catch (error) {
      logger.error(`[closeTicket] Transcript oluşturulurken hata: ${error.message}`);
    }

    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE ticket_system SET closedAt = ?, closedBy = ? WHERE channelId = ?",
        [new Date().toISOString(), closedBy, channel.id],
        function (error) {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    const logChannelId = await getLogChannelIdForGuild(channel.guild.id, db);
    if (logChannelId && transcript) {
      try {
        const logChannel = await channel.guild.channels.fetch(logChannelId);
        if (logChannel) {
          const transcriptEmbed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle("🎫 Ticket Kapatıldı")
            .addFields(
              { name: "Ticket ID", value: ticket.ticketId, inline: true },
              { name: "Sahibi", value: `<@${ticket.ownerId}>`, inline: true },
              { name: "Kapatış Tarihi", value: new Date().toLocaleString("tr-TR"), inline: true },
              { name: "Kapatıldı By", value: `<@${closedBy}>`, inline: true },
              { name: "Kategori", value: TICKET_CATEGORIES[ticket.category]?.label || ticket.category, inline: true },
            )
            .setTimestamp();

          await logChannel.send({
            embeds: [transcriptEmbed],
            files: [{ attachment: transcript, name: `${ticket.ticketId}.html` }],
          });
        } else {
          logger.warn(`[closeTicket] Log kanalı bulunamadı: ${logChannelId}`);
        }
      } catch (error) {
        logger.error(`[closeTicket] Log kanalına transcript gönderilemedi: ${error.message}`);
      }
    } else if (logChannelId && !transcript) {
      logger.warn("[closeTicket] Transcript oluşturulamadığı için loga gönderme atlandı.");
    }

    await channel.delete().catch((error) => {
      logger.error(`[closeTicket] Kanal silinirken hata: ${error?.message || error}`);
    });

    return true;
  } catch (error) {
    logger.error(`[closeTicket] ${error.message}`);
    throw error;
  }
};

module.exports = {
  TICKET_CATEGORIES,
  generateTicketId,
  getNextTicketNumber,
  getUserOpenTickets,
  createTicket,
  closeTicket,
};
