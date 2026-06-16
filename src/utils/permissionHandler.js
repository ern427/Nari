const { PermissionFlagsBits } = require("discord.js");

const adminRoleNames = ["Admin", "Yönetici"];
const moderatorRoleNames = ["Moderator", "Moderatör", "Mod"];

const getPermissionLevel = (member) => {
  if (!member) return "user";
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return "admin";
  if (member.roles.cache.some((role) => adminRoleNames.includes(role.name))) return "admin";

  if (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.roles.cache.some((role) => moderatorRoleNames.includes(role.name))
  ) {
    return "moderator";
  }

  return "user";
};

const canRun = (member, requiredLevel) => {
  const level = getPermissionLevel(member);

  if (requiredLevel === "admin") {
    return level === "admin";
  }

  if (requiredLevel === "moderator") {
    return level === "admin" || level === "moderator";
  }

  return false;
};

const requireModerator = async (interaction) => {
  if (!canRun(interaction.member, "moderator")) {
    await interaction.reply({ content: "Bu komutu kullanmak için yeterli yetkiniz yok.", ephemeral: true });
    return false;
  }

  return true;
};

const requireAdmin = async (interaction) => {
  if (!canRun(interaction.member, "admin")) {
    await interaction.reply({ content: "Bu komutu kullanmak için Admin yetkisine sahip olmalısınız.", ephemeral: true });
    return false;
  }

  return true;
};

module.exports = {
  getPermissionLevel,
  canRun,
  requireModerator,
  requireAdmin,
};
