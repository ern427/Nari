const { buildMessageLog, sendLog } = require("../utils/advancedLogger");
const logger = require("../utils/logger");

module.exports = {
  name: "messageUpdate",
  execute: async (oldMessage, newMessage) => {
    try {
      if (!oldMessage.guild || oldMessage.author.bot) return;

      // Only log if content changed
      if (oldMessage.content === newMessage.content) return;

      const embed = buildMessageLog("edit", newMessage, oldMessage);
      await sendLog(oldMessage.guild, embed, oldMessage.client.db);
    } catch (error) {
      logger.error(`[messageUpdate] ${error.message}`);
    }
  },
};
