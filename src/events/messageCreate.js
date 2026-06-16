const { PermissionFlagsBits } = require("discord.js");
const { getSecuritySettings } = require("../utils/settingsManager");
const logger = require("../utils/logger");

const userActivity = new Map();
const FLOOD_WINDOW_MS = 10000;
const FLOOD_MESSAGE_LIMIT = 6;
const MENTION_LIMIT = 5;

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const hours = Math.floor(milliseconds / 3600000);
  return `${hours ? `${hours} saat ` : ""}${minutes ? `${minutes} dakika ` : ""}${seconds} saniye`;
};

const sendTemporaryWarning = async (message, text) => {
  if (!message.channel.permissionsFor(message.guild.members.me)?.has(PermissionFlagsBits.SendMessages)) return;
  try {
    const reply = await message.reply({ content: text, allowedMentions: { repliedUser: false } });
    setTimeout(() => reply.delete().catch(() => null), 5000);
  } catch (error) {
    logger.error(`[messageCreate] Uyarı gönderilemedi: ${error.message}`);
  }
};

module.exports = {
  name: "messageCreate",
  execute: async (message) => {
    try {
      if (!message.guild || message.author.bot) return;

      const settings = await getSecuritySettings(message.guild.id, message.client.db);
      if (!settings) return;

      const now = Date.now();
      const key = `${message.guild.id}:${message.author.id}`;
      const activity = userActivity.get(key) || { messages: [], lastContent: null, repeatCount: 0 };

      activity.messages = activity.messages.filter((timestamp) => now - timestamp <= FLOOD_WINDOW_MS);
      activity.messages.push(now);

      const mentionCount = message.mentions.users.size + message.mentions.roles.size + message.mentions.channels.size;

      if (settings.antiMentionSpam && mentionCount >= MENTION_LIMIT) {
        await message.delete().catch(() => null);
        await sendTemporaryWarning(message, "🔇 Lütfen aynı anda çok fazla mention kullanmayın.");
        userActivity.set(key, { messages: activity.messages, lastContent: null, repeatCount: 0 });
        return;
      }

      if (settings.antiFlood && activity.messages.length >= FLOOD_MESSAGE_LIMIT) {
        await message.delete().catch(() => null);
        await sendTemporaryWarning(message, "⚠️ Çok hızlı yazıyorsunuz. Lütfen biraz bekleyin.");
        userActivity.set(key, { messages: activity.messages, lastContent: null, repeatCount: 0 });
        return;
      }

      const content = (message.content || "").trim();
      if (settings.antiSpam && content.length > 0) {
        if (activity.lastContent === content) {
          activity.repeatCount += 1;
        } else {
          activity.lastContent = content;
          activity.repeatCount = 1;
        }

        if (activity.repeatCount >= 3) {
          await message.delete().catch(() => null);
          await sendTemporaryWarning(message, "⚠️ Aynı mesajı tekrar tekrar göndermeyin.");
          userActivity.set(key, { messages: activity.messages, lastContent: null, repeatCount: 0 });
          return;
        }
      }

      userActivity.set(key, activity);
    } catch (error) {
      logger.error(`[messageCreate] ${error.stack || error.message || error}`);
    }
  },
};