const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const logger = require("../utils/logger");

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "database.sqlite");
const databaseDirectory = path.dirname(databasePath);

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

let SQL;
let db;

// sql.js'i başlat ve veritabanı dosyasını yükle
const initializeDatabase = async () => {
  try {
    SQL = await initSqlJs();
    
    let fileBuffer = null;
    if (fs.existsSync(databasePath)) {
      fileBuffer = fs.readFileSync(databasePath);
    }
    
    db = new SQL.Database(fileBuffer);
    // PRAGMA'ları çalıştır
    db.run("PRAGMA foreign_keys = ON");
    
    logger.info(`SQLite veritabanına bağlandı: ${databasePath}`);
    
    // Tabloları oluştur
    createTables();
    
    // Veritabanını diskte kaydet
    saveDatabase();
  } catch (error) {
    logger.error(`SQLite veritabanı başlatılırken hata oluştu: ${error.message}`);
    process.exit(1);
  }
};

// Veritabanını diskte kaydet
const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(databasePath, buffer);
  } catch (error) {
    logger.error(`Veritabanı dosyası kaydedilirken hata oluştu: ${error.message}`);
  }
};

// Tabloları oluştur
const createTables = () => {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        moderatorId TEXT NOT NULL,
        reason TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS log_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL UNIQUE,
        logChannelId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS ticket_system (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketId TEXT NOT NULL UNIQUE,
        guildId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        category TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        closedAt TEXT,
        closedBy TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS security_settings (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS auto_role_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL UNIQUE,
        roleId TEXT,
        enabled INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS welcome_settings (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS rules_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL UNIQUE,
        enabled INTEGER NOT NULL DEFAULT 0,
        rulesText TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`
    ];

    tables.forEach(sql => {
      try {
        db.run(sql);
      } catch (error) {
        // Tablo zaten var olabilir, hatasız devam et
        if (!error.message.includes("already exists")) {
          throw error;
        }
      }
    });

    logger.info("Tüm tablolar başarıyla oluşturuldu veya mevcut.");
  } catch (error) {
    logger.error(`Tablo oluşturma hatası: ${error.message}`);
  }
};

// Veritabanını periyodik olarak kaydet (her 30 saniyede bir)
const autoSave = () => {
  setInterval(() => {
    saveDatabase();
  }, 30000); // 30 saniye
};

// Export: başlatılmış veritabanı ve fonksiyonlar
module.exports = {
  initializeDatabase,
  saveDatabase,
  autoSave,
  getDb: () => db,
  getSql: () => SQL,
  databasePath,
};
