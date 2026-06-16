const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const logger = require("../utils/logger");

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "database.sqlite");
const databaseDirectory = path.dirname(databasePath);

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

if (!fs.existsSync(databasePath)) {
  fs.writeFileSync(databasePath, "", "utf8");
}

const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
  if (error) {
    logger.error(`SQLite veritabanı açılırken hata oluştu: ${error.message}`);
    return;
  }
  logger.info(`SQLite veritabanına bağlandı: ${databasePath}`);
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");
  db.run(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      userId TEXT NOT NULL,
      moderatorId TEXT NOT NULL,
      reason TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS log_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL UNIQUE,
      logChannelId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_system (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId TEXT NOT NULL UNIQUE,
      guildId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      category TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      closedAt TEXT,
      closedBy TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS security_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL UNIQUE,
      antiSpam INTEGER NOT NULL DEFAULT 0,
      antiFlood INTEGER NOT NULL DEFAULT 0,
      antiMentionSpam INTEGER NOT NULL DEFAULT 0,
      antiRaid INTEGER NOT NULL DEFAULT 0,
      antiBot INTEGER NOT NULL DEFAULT 0,
      antiMassJoin INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS auto_role_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL UNIQUE,
      roleId TEXT,
      enabled INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS welcome_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL UNIQUE,
      channelId TEXT,
      enabled INTEGER NOT NULL DEFAULT 0,
      welcomeMessage TEXT,
      dmMessage TEXT,
      rulesMessage TEXT,
      embedTitle TEXT,
      embedDescription TEXT,
      embedColor TEXT,
      footerText TEXT,
      thumbnailURL TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS rules_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 0,
      rulesText TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
});

module.exports = {
  db,
  databasePath,
};
