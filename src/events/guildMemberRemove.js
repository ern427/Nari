const { buildMemberLog, sendLog } = require("../utils/advancedLogger");
const logger = require("../utils/logger");

module.exports = {
  name: "guildMemberRemove",
  execute: async (member) => {
    try {
      if (member.bot) return;

      const embed = buildMemberLog("leave", member);
      await sendLog(member.guild, embed, member.client.db);
    } catch (error) {
      logger.error(`[guildMemberRemove] ${error.message}`);
    }
  },
};
