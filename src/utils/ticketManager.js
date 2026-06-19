const logger = require("./logger");
const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

// ... (TICKET_CATEGORIES, generateTicketId, getNextTicketNumber, getUserOpenTickets unchanged)

const createTicket = async (guild, user, category, client) => {
  try {
    const ticketNumber = await getNextTicketNumber(guild, client.db);
    const ticketId = `ticket-${String(ticketNumber).padStart(4, "0")}`;

    const moderatorRole = guild.roles.cache.find(
      (role) => role.name.toLowerCase().includes("moderator") || role.name.toLowerCase().includes("mod"),
    );

    const channel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
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

    if (moderatorRole) {
      await channel.permissionOverwrites.create(moderatorRole, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
    }

    await client.db.runAsync(
      `INSERT INTO ticket_system (ticketId, guildId, channelId, ownerId, category, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, guild.id, channel.id, user.id, category, new Date().toISOString()],
    );

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

    // --- NEW: send creation log to configured log channel ---
    const { buildChannelLog, sendLog } = require("./advancedLogger");
    const logEmbed = buildChannelLog("ticket_open", channel, user);
    await sendLog(guild, logEmbed, client.db);

    return channel;
  } catch (error) {
    logger.error(`[createTicket] ${error.message}`);
    throw error;
  }
};

const getLogChannelIdForGuild = async (guildId, db) => {
  try {
    const row = await db.getAsync("SELECT logChannelId FROM log_settings WHERE guildId = ?", [guildId]);
    return row?.logChannelId || null;
  } catch (error) {
    logger.error(`[getLogChannelIdForGuild] ${error.message}`);
    return null;
  }
};

const closeTicket = async (channel, closedBy, client, db) => {
  try {
    if (!channel || !channel.guild) {
      throw new Error("Geçersiz kanal bilgisi");
    }

    const ticket = await db.getAsync("SELECT * FROM ticket_system WHERE channelId = ?", [channel.id]);
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

    await db.runAsync(
      "UPDATE ticket_system SET closedAt = ?, closedBy = ? WHERE channelId = ?",
      [new Date().toISOString(), closedBy, channel.id],
    );

    const logChannelId = await getLogChannelIdForGuild(channel.guild.id, db);

    // --- FIXED: send log even if transcript failed ---
    if (logChannelId) {
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

          const payload = { embeds: [transcriptEmbed] };
          if (transcript) {
            payload.files = [{ attachment: transcript, name: `${ticket.ticketId}.html` }];
          } else {
            transcriptEmbed.addFields({ name: "Not", value: "Transcript oluşturulamadı.", inline: false });
          }

          await logChannel.send(payload);
        } else {
          logger.warn(`[closeTicket] Log kanalı bulunamadı: ${logChannelId}`);
        }
      } catch (error) {
        logger.error(`[closeTicket] Log kanalına gönderilemedi: ${error.message}`);
      }
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