const { buildMessageLog, sendLog } = require("../utils/advancedLogger");
const logger = require("../utils/logger");

module.exports = {
  name: "messageDelete",
  execute: async (message) => {
    try {
      if (!message.guild || message.author.bot) return;

      const embed = buildMessageLog("delete", message);
      await sendLog(message.guild, embed, message.client.db);
    } catch (error) {
      logger.error(`[messageDelete] ${error.message}`);
    }
  },
};
