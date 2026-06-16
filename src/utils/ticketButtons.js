const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const getTicketActionRow = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Ticket Kapat")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒"),
    new ButtonBuilder()
      .setCustomId("ticket_add_staff")
      .setLabel("Yetkili Ekle")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➕"),
    new ButtonBuilder()
      .setCustomId("ticket_remove_staff")
      .setLabel("Yetkili Çıkar")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➖"),
    new ButtonBuilder()
      .setCustomId("ticket_info")
      .setLabel("Ticket Bilgileri")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📋"),
  );
};

module.exports = {
  getTicketActionRow,
};
