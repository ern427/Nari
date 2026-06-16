const { buildRoleLog, sendLog } = require("../utils/advancedLogger");
const logger = require("../utils/logger");

module.exports = {
  name: "guildMemberUpdate",
  execute: async (oldMember, newMember) => {
    try {
      if (newMember.bot) return;

      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      // Check for added roles
      const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
      if (addedRoles.size > 0) {
        for (const role of addedRoles.values()) {
          const embed = buildRoleLog("add", newMember, role);
          await sendLog(newMember.guild, embed, newMember.client.db);
        }
      }

      // Check for removed roles
      const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));
      if (removedRoles.size > 0) {
        for (const role of removedRoles.values()) {
          const embed = buildRoleLog("remove", newMember, role);
          await sendLog(newMember.guild, embed, newMember.client.db);
        }
      }
    } catch (error) {
      logger.error(`[guildMemberUpdate] ${error.message}`);
    }
  },
};
