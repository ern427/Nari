const { get, run } = require("./db");
const logger = require("./logger");

const booleanToInteger = (value) => (value ? 1 : 0);

const getSecuritySettings = async (guildId, db) => {
  const row = await get(db, "SELECT * FROM security_settings WHERE guildId = ?", [guildId]).catch(() => null);
  return {
    antiSpam: !!row?.antiSpam,
    antiFlood: !!row?.antiFlood,
    antiMentionSpam: !!row?.antiMentionSpam,
    antiRaid: !!row?.antiRaid,
    antiBot: !!row?.antiBot,
    antiMassJoin: !!row?.antiMassJoin,
  };
};

const updateSecuritySetting = async (guildId, settingName, enabled, db) => {
  const mapping = {
    antiSpam: "antiSpam",
    antiFlood: "antiFlood",
    antiMentionSpam: "antiMentionSpam",
    antiRaid: "antiRaid",
    antiBot: "antiBot",
    antiMassJoin: "antiMassJoin",
  };

  if (!Object.prototype.hasOwnProperty.call(mapping, settingName)) {
    throw new Error(`Bilinmeyen güvenlik ayarı: ${settingName}`);
  }

  const field = mapping[settingName];

  await run(
    db,
    `INSERT OR IGNORE INTO security_settings (guildId, antiSpam, antiFlood, antiMentionSpam, antiRaid, antiBot, antiMassJoin, createdAt, updatedAt) VALUES (?, 0, 0, 0, 0, 0, 0, datetime('now'), datetime('now'))`,
    [guildId],
  );

  await run(db, `UPDATE security_settings SET ${field} = ?, updatedAt = datetime('now') WHERE guildId = ?`, [booleanToInteger(enabled), guildId]);
};

const getAutoRoleSettings = async (guildId, db) => {
  const row = await get(db, "SELECT * FROM auto_role_settings WHERE guildId = ?", [guildId]).catch(() => null);
  return {
    enabled: !!row?.enabled,
    roleId: row?.roleId || null,
  };
};

const setAutoRoleSettings = async (guildId, roleId, enabled, db) => {
  await run(
    db,
    `INSERT OR IGNORE INTO auto_role_settings (guildId, roleId, enabled, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [guildId, roleId, booleanToInteger(enabled)],
  );

  await run(
    db,
    "UPDATE auto_role_settings SET roleId = ?, enabled = ?, updatedAt = datetime('now') WHERE guildId = ?",
    [roleId, booleanToInteger(enabled), guildId],
  );
};

const getWelcomeSettings = async (guildId, db) => {
  const row = await get(db, "SELECT * FROM welcome_settings WHERE guildId = ?", [guildId]).catch(() => null);
  return {
    enabled: !!row?.enabled,
    channelId: row?.channelId || null,
    welcomeMessage: row?.welcomeMessage || null,
    dmMessage: row?.dmMessage || null,
    rulesMessage: row?.rulesMessage || null,
    embedTitle: row?.embedTitle || null,
    embedDescription: row?.embedDescription || null,
    embedColor: row?.embedColor || null,
    footerText: row?.footerText || null,
    thumbnailURL: row?.thumbnailURL || null,
  };
};

const setWelcomeSettings = async (guildId, settings, db) => {
  await run(
    db,
    `INSERT OR IGNORE INTO welcome_settings (guildId, channelId, enabled, welcomeMessage, dmMessage, rulesMessage, embedTitle, embedDescription, embedColor, footerText, thumbnailURL, createdAt, updatedAt) VALUES (?, ?, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, datetime('now'), datetime('now'))`,
    [guildId, settings.channelId || null],
  );

  await run(
    db,
    `UPDATE welcome_settings SET channelId = ?, enabled = ?, welcomeMessage = ?, dmMessage = ?, rulesMessage = ?, embedTitle = ?, embedDescription = ?, embedColor = ?, footerText = ?, thumbnailURL = ?, updatedAt = datetime('now') WHERE guildId = ?`,
    [
      settings.channelId || null,
      booleanToInteger(settings.enabled),
      settings.welcomeMessage || null,
      settings.dmMessage || null,
      settings.rulesMessage || null,
      settings.embedTitle || null,
      settings.embedDescription || null,
      settings.embedColor || null,
      settings.footerText || null,
      settings.thumbnailURL || null,
      guildId,
    ],
  );
};

const getRulesSettings = async (guildId, db) => {
  const row = await get(db, "SELECT * FROM rules_settings WHERE guildId = ?", [guildId]).catch(() => null);
  return {
    enabled: !!row?.enabled,
    rulesText: row?.rulesText || null,
  };
};

const setRulesSettings = async (guildId, rulesText, enabled, db) => {
  await run(
    db,
    `INSERT OR IGNORE INTO rules_settings (guildId, enabled, rulesText, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [guildId, booleanToInteger(enabled), rulesText],
  );

  await run(
    db,
    "UPDATE rules_settings SET enabled = ?, rulesText = ?, updatedAt = datetime('now') WHERE guildId = ?",
    [booleanToInteger(enabled), rulesText, guildId],
  );
};

module.exports = {
  getSecuritySettings,
  updateSecuritySetting,
  getAutoRoleSettings,
  setAutoRoleSettings,
  getWelcomeSettings,
  setWelcomeSettings,
  getRulesSettings,
  setRulesSettings,
};