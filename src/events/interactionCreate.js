const logger = require("../utils/logger");
const { handleInteractionError } = require("../utils/errorHandler");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
} = require("discord.js");

const helpCategories = {
  genel: {
    title: "Genel Komutlar",
    description: "En temel bot komutları buradan ulaşılabilir.",
    commands: [
      { name: "/yardim", value: "Komut kategorilerini gösterir." },
      { name: "/ping", value: "Botun gecikmesini gösterir." },
      { name: "/avatar", value: "Kullanıcı avatarını gösterir." },
      { name: "/kullanici-bilgi", value: "Kullanıcı hakkında bilgi verir." },
      { name: "/sunucu-bilgi", value: "Sunucu hakkında bilgi verir." },
      { name: "/bot-bilgi", value: "Bot hakkında teknik bilgiler verir." },
    ],
  },
  moderasyon: {
    title: "Moderasyon",
    description: "Sunucu yönetimi için gelişmiş moderasyon komutları.",
    commands: [
      { name: "/ban", value: "Bir kullanıcıyı sunucudan yasaklar." },
      { name: "/kick", value: "Bir kullanıcıyı sunucudan atar." },
      { name: "/timeout", value: "Bir kullanıcıyı belirli süre susturur." },
      { name: "/untimeout", value: "Bir kullanıcıya verilen timeout'u kaldırır." },
      { name: "/warn", value: "Bir kullanıcıyı uyarır." },
      { name: "/warnings", value: "Bir kullanıcının uyarı geçmişini gösterir." },
      { name: "/clear", value: "Mesajları toplu şekilde siler." },
      { name: "/lock", value: "Kanalı kilitler." },
      { name: "/unlock", value: "Kanal kilidini açar." },
      { name: "/slowmode", value: "Kanal slowmode süresini ayarlar." },
    ],
  },
  ticket: {
    title: "Ticket Sistemi",
    description: "Destek ve şikayetler için ticket sistemi komutları.",
    commands: [
      { name: "/ticket-panel", value: "Ticket sistemi panelini oluşturur." },
      { name: "/ticket-gecmis", value: "Bir kullanıcının ticket geçmişini gösterir." },
      { name: "/ticket-istatistik", value: "Ticket sistemi istatistiklerini gösterir." },
    ],
  },
  guvenlik: {
    title: "Güvenlik",
    description: "Sunucu güvenlik sistemlerini yönetir.",
    commands: [
      { name: "/guvenlik", value: "Güvenlik sistemlerini açar veya kapatır." },
    ],
  },
  performans: {
    title: "Sunucu ve Bot Yönetimi",
    description: "Yönetim ve istatistik komutları.",
    commands: [
      { name: "/otorol-ayarla", value: "Yeni üyelere otomatik rol verir." },
      { name: "/otorol-kapat", value: "Otorol sistemini kapatır." },
      { name: "/hosgeldin-ayarla", value: "Karşılama sistemini ayarlar." },
      { name: "/hosgeldin-kapat", value: "Karşılama sistemini kapatır." },
      { name: "/kurallar-ayarla", value: "Yeni üyeye DM ile kuralları gönderir." },
      { name: "/embed", value: "Özel embed mesajı oluşturur." },
      { name: "/panel", value: "Sunucu ve bot panelini gösterir." },
      { name: "/istatistik", value: "Bot istatistiklerini gösterir." },
      { name: "/uptime", value: "Botun çalışma süresini gösterir." },
    ],
  },
  eglence: {
    title: "Eğlence",
    description: "Eğlence komutları burada listelenecek.",
    commands: [],
  },
};

const buildHelpEmbed = (categoryKey) => {
  const category = helpCategories[categoryKey];
  const embed = new EmbedBuilder()
    .setColor("#2f3136")
    .setTitle(category.title)
    .setDescription(category.description)
    .setTimestamp()
    .setFooter({ text: "Nari Yardım Menüsü" });

  if (category.commands.length) {
    const fields = category.commands.map((item) => ({ name: item.name, value: item.value }));
    embed.addFields(fields);
  }

  return embed;
};

const buildWarningsEmbed = (warnings, page, pageSize, targetTag) => {
  const offset = page * pageSize;
  const pageWarnings = warnings.slice(offset, offset + pageSize);
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle(`${targetTag} kullanıcısının uyarı geçmişi`)
    .setDescription(`Toplam uyarı: ${warnings.length}`)
    .setTimestamp();

  if (pageWarnings.length) {
    embed.addFields(
      pageWarnings.map((warning, index) => ({
        name: `${offset + index + 1}. Uyarı`,
        value: `**Sebep:** ${warning.reason}\n**Yetkili:** <@${warning.moderatorId}>\n**Tarih:** ${new Date(warning.createdAt).toLocaleString()}`,
      })),
    );
  } else {
    embed.setDescription(`${targetTag} için uyarı bulunamadı.`);
  }

  embed.setFooter({ text: `Sayfa ${page + 1}/${Math.max(1, Math.ceil(warnings.length / pageSize))}` });
  return embed;
};

module.exports = {
  name: "interactionCreate",
  execute: async (interaction) => {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_category_select") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const { createTicket, getUserOpenTickets } = require("../utils/ticketManager");
          const { sendLog, buildChannelLog } = require("../utils/advancedLogger");

          const category = interaction.values[0];
          const openTickets = await getUserOpenTickets(interaction.user.id, interaction.guild.id, interaction.client.db);

          if (openTickets.length >= 2) {
            return interaction.editReply({
              content: "❌ Aynı anda maksimum 2 ticket açabilirsiniz. Lütfen açık ticketlerinizden birini kapatınız.",
            });
          }

          const channel = await createTicket(interaction.guild, interaction.user, category, interaction.client);

          const successEmbed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ Ticket Açıldı")
            .setDescription(`Ticket başarıyla açıldı: ${channel}`)
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed] });

          const logEmbed = buildChannelLog("ticket_open", channel, interaction.user, `Kategori: ${category}`);
          await sendLog(interaction.guild, logEmbed, interaction.client.db);
        } catch (error) {
          logger.error(`[ticket_category_select] ${error.message}`);
          return interaction.editReply({ content: "Ticket açılırken bir hata oluştu." });
        }

        return;
      }

      if (interaction.customId === "help-category-select") {
        const selected = interaction.values[0];
        const embed = buildHelpEmbed(selected);
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("help-category-select")
            .setPlaceholder("Kategori seç")
            .addOptions([
              { label: "Genel Komutlar", value: "genel" },
              { label: "Moderasyon", value: "moderasyon" },
              { label: "Ticket", value: "ticket" },
              { label: "Güvenlik", value: "guvenlik" },
              { label: "Eğlence", value: "eglence" },
            ]),
        );

        try {
          await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
          logger.error(error);
        }

        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ticket_close") {
        logger.info(`[ticket_close] ${interaction.user.tag} tarafından tetiklendi. Kanal: ${interaction.channel?.id}`);

        await interaction.deferReply({ ephemeral: true });

        try {
          const { closeTicket } = require("../utils/ticketManager");

          const embed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle("🎫 Ticket Kapatılıyor")
            .setDescription("Lütfen bekleyin, ticket kapatılıyor...");

          await interaction.editReply({ embeds: [embed], components: [] });
          await closeTicket(interaction.channel, interaction.user.id, interaction.client, interaction.client.db);

          const successEmbed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ Ticket Kapatıldı")
            .setDescription("Ticket başarıyla kapatıldı ve kanal silindi.");

          await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
          logger.error(`[ticket_close] ${error.stack || error.message || error}`);

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "Ticket kapatılırken bir hata oluştu.", ephemeral: true });
          } else {
            await interaction.reply({ content: "Ticket kapatılırken bir hata oluştu.", ephemeral: true });
          }
        }

        return;
      }

      if (interaction.customId === "ticket_add_staff") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId("ticket_add_user_select")
              .setPlaceholder("Eklenecek kullanıcıyı seçiniz...")
              .setMaxValues(1),
          );

          await interaction.editReply({
            content: "Ticket kanalına eklenecek kullanıcıyı seçiniz:",
            components: [row],
          });
        } catch (error) {
          logger.error(`[ticket_add_staff] ${error.message}`);
          return interaction.editReply({ content: "Bir hata oluştu." });
        }

        return;
      }

      if (interaction.customId === "ticket_remove_staff") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const row = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId("ticket_remove_user_select")
              .setPlaceholder("Çıkarılacak kullanıcıyı seçiniz...")
              .setMaxValues(1),
          );

          await interaction.editReply({
            content: "Ticket kanalından çıkarılacak kullanıcıyı seçiniz:",
            components: [row],
          });
        } catch (error) {
          logger.error(`[ticket_remove_staff] ${error.message}`);
          return interaction.editReply({ content: "Bir hata oluştu." });
        }

        return;
      }

      if (interaction.customId === "ticket_info") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const ticket = await new Promise((resolve, reject) => {
            interaction.client.db.get(
              "SELECT * FROM ticket_system WHERE channelId = ?",
              [interaction.channel.id],
              (error, row) => {
                if (error) reject(error);
                else resolve(row);
              },
            );
          });

          if (!ticket) {
            return interaction.editReply({ content: "Ticket bilgileri bulunamadı." });
          }

          const { TICKET_CATEGORIES } = require("../utils/ticketManager");
          const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("📋 Ticket Bilgileri")
            .addFields(
              { name: "Ticket ID", value: ticket.ticketId, inline: true },
              { name: "Sahibi", value: `<@${ticket.ownerId}>`, inline: true },
              { name: "Kanal ID", value: ticket.channelId, inline: true },
              { name: "Kategori", value: TICKET_CATEGORIES[ticket.category]?.label || ticket.category, inline: true },
              { name: "Açılış Tarihi", value: new Date(ticket.createdAt).toLocaleString("tr-TR"), inline: true },
              { name: "Durum", value: ticket.closedAt ? "Kapalı" : "Açık", inline: true },
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          logger.error(`[ticket_info] ${error.message}`);
          return interaction.editReply({ content: "Ticket bilgileri getirilirken hata oluştu." });
        }

        return;
      }

      const buttonMatch = interaction.customId.match(/^warnings_(previous|next)_(\d+)_(\d+)$/);
      if (buttonMatch && interaction.guild) {
        await interaction.deferUpdate();

        const [, direction, targetId, pageString] = buttonMatch;
        const currentPage = Number(pageString);
        const nextPage = direction === "next" ? currentPage + 1 : currentPage - 1;
        const pageSize = 3;

        const warnings = await new Promise((resolve, reject) => {
          interaction.client.db.all(
            "SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY createdAt DESC",
            [interaction.guild.id, targetId],
            (error, rows) => {
              if (error) return reject(error);
              resolve(rows || []);
            },
          );
        }).catch((error) => {
          logger.error(error);
          return null;
        });

        if (!warnings) return;

        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
        const targetTag = targetMember ? targetMember.user.tag : `ID: ${targetId}`;
        const totalPages = Math.max(1, Math.ceil(warnings.length / pageSize));
        const embed = buildWarningsEmbed(warnings, nextPage, pageSize, targetTag);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`warnings_previous_${targetId}_${nextPage}`)
            .setLabel("Önceki")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(nextPage <= 0),
          new ButtonBuilder()
            .setCustomId(`warnings_next_${targetId}_${nextPage}`)
            .setLabel("Sonraki")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(nextPage >= totalPages - 1),
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
      }
    }

    if (interaction.isUserSelectMenu()) {
      if (interaction.customId === "ticket_add_user_select") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const selectedUser = interaction.users.first();
          const { sendLog } = require("../utils/advancedLogger");

          await interaction.channel.permissionOverwrites.create(selectedUser, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });

          const embed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ Yetkili Eklendi")
            .setDescription(`${selectedUser} ticket kanalına eklendi.`)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

          const logEmbed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("👤 Yetkili Eklendi")
            .addFields(
              { name: "Eklenen", value: `${selectedUser}`, inline: true },
              { name: "Ekleme Yapan", value: `${interaction.user}`, inline: true },
              { name: "Kanal", value: `${interaction.channel}`, inline: true },
            )
            .setTimestamp();

          await sendLog(interaction.guild, logEmbed, interaction.client.db);
        } catch (error) {
          logger.error(`[ticket_add_user_select] ${error.message}`);
          return interaction.editReply({ content: "Yetkili eklenirken hata oluştu." });
        }

        return;
      }

      if (interaction.customId === "ticket_remove_user_select") {
        await interaction.deferReply({ ephemeral: true });

        try {
          const selectedUser = interaction.users.first();
          const { sendLog } = require("../utils/advancedLogger");

          await interaction.channel.permissionOverwrites.delete(selectedUser);

          const embed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle("✅ Yetkili Çıkarıldı")
            .setDescription(`${selectedUser} ticket kanalından çıkarıldı.`)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

          const logEmbed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("👤 Yetkili Çıkarıldı")
            .addFields(
              { name: "Çıkarılan", value: `${selectedUser}`, inline: true },
              { name: "Çıkarma Yapan", value: `${interaction.user}`, inline: true },
              { name: "Kanal", value: `${interaction.channel}`, inline: true },
            )
            .setTimestamp();

          await sendLog(interaction.guild, logEmbed, interaction.client.db);
        } catch (error) {
          logger.error(`[ticket_remove_user_select] ${error.message}`);
          return interaction.editReply({ content: "Yetkili çıkarılırken hata oluştu." });
        }

        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Komut bulunamadı: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      await handleInteractionError(interaction, error);
    }
  },
};
