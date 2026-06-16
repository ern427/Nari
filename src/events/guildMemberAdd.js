const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { buildMemberLog, sendLog } = require("../utils/advancedLogger");
const {
  getSecuritySettings,
  getAutoRoleSettings,
  getWelcomeSettings,
  getRulesSettings,
} = require("../utils/settingsManager");
const logger = require("../utils/logger");

const joinHistory = new Map();
const RAID_WINDOW_MS = 20000;
const RAID_THRESHOLD = 6;

const cleanupJoinHistory = (guildId) => {
  const now = Date.now();
  const history = joinHistory.get(guildId) || [];
  const filtered = history.filter((timestamp) => now - timestamp <= RAID_WINDOW_MS);

  if (filtered.length > 0) {
    joinHistory.set(guildId, filtered);
  } else {
    joinHistory.delete(guildId);
  }
};

module.exports = {
  name: "guildMemberAdd",
  execute: async (member) => {
    try {
      if (!member.guild) return;

      const guildId = member.guild.id;
      const securitySettings = await getSecuritySettings(guildId, member.client.db);
      const autoroleSettings = await getAutoRoleSettings(guildId, member.client.db);
      const welcomeSettings = await getWelcomeSettings(guildId, member.client.db);
      const rulesSettings = await getRulesSettings(guildId, member.client.db);

      if (securitySettings?.antiBot && member.user.bot) {
        try {
          await member.kick("Anti Bot aktif");
          logger.info(`[guildMemberAdd] Anti Bot: ${member.user.tag} botu sunucudan atıldı.`);
        } catch (error) {
          logger.error(`[guildMemberAdd] Anti Bot uygulandı, ancak bot atılamadı: ${error.message}`);
        }
        return;
      }

      if (securitySettings?.antiMassJoin || securitySettings?.antiRaid) {
        const now = Date.now();
        const history = joinHistory.get(guildId) || [];
        history.push(now);
        joinHistory.set(guildId, history.filter((timestamp) => now - timestamp <= RAID_WINDOW_MS));

        if (history.length >= RAID_THRESHOLD) {
          const alertEmbed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle("🚨 Olası Raid / Toplu Katılım Tespit Edildi")
            .setDescription("Aynı anda çok sayıda üye katılımı tespit edildi.")
            .addFields(
              { name: "Sunucu", value: `${member.guild.name}`, inline: true },
              { name: "Toplam Katılım", value: `${history.length}`, inline: true },
            )
            .setTimestamp();

          await sendLog(member.guild, alertEmbed, member.client.db);
        }
      }

      if (autoroleSettings?.enabled && autoroleSettings?.roleId) {
        try {
          const role = member.guild.roles.cache.get(autoroleSettings.roleId);
          if (role && member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            await member.roles.add(role);
          }
        } catch (error) {
          logger.error(`[guildMemberAdd] Otorol atanamadı: ${error.message}`);
        }
      }

      if (welcomeSettings?.enabled && welcomeSettings.channelId) {
        try {
          const welcomeChannel = await member.guild.channels.fetch(welcomeSettings.channelId);
          if (welcomeChannel && welcomeChannel.type === ChannelType.GuildText) {
            const embed = new EmbedBuilder()
              .setColor(welcomeSettings.embedColor || "#5865F2")
              .setTitle(welcomeSettings.embedTitle || "Hoşgeldin!")
              .setDescription(welcomeSettings.embedDescription || `${member} sunucuya katıldı.`)
              .setTimestamp();

            if (welcomeSettings.footerText) embed.setFooter({ text: welcomeSettings.footerText });
            if (welcomeSettings.thumbnailURL) embed.setThumbnail(welcomeSettings.thumbnailURL);

            await welcomeChannel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);
            if (welcomeSettings.rulesMessage) {
              await welcomeChannel.send({ content: welcomeSettings.rulesMessage }).catch(() => null);
            }
          }
        } catch (error) {
          logger.error(`[guildMemberAdd] Karşılama kanalı mesajı gönderilemedi: ${error.message}`);
        }
      }

      if (welcomeSettings?.dmMessage) {
        try {
          await member.send({ content: welcomeSettings.dmMessage }).catch(() => null);
        } catch (error) {
          logger.error(`[guildMemberAdd] DM karşılama mesajı gönderilemedi: ${error.message}`);
        }
      }

      if (rulesSettings?.enabled && rulesSettings.rulesText) {
        try {
          await member.send({ content: rulesSettings.rulesText }).catch(() => null);
        } catch (error) {
          logger.error(`[guildMemberAdd] Kurallar DM gönderilemedi: ${error.message}`);
        }
      }

      if (!member.user.bot) {
        const embed = buildMemberLog("join", member);
        await sendLog(member.guild, embed, member.client.db);
      }
    } catch (error) {
      logger.error(`[guildMemberAdd] ${error.stack || error.message || error}`);
    }
  },
};
