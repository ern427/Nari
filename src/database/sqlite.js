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

// FIX: Track whether initialization has completed.
// getDb() now throws clearly instead of returning undefined silently.
let initialized = false;

const initializeDatabase = async () => {
  try {
    SQL = await initSqlJs();

    let fileBuffer = null;
    if (fs.existsSync(databasePath)) {
      fileBuffer = fs.readFileSync(databasePath);
    }

    db = new SQL.Database(fileBuffer);

    // FIX: Attach the compatibility shim BEFORE doing anything else with db,
    // so that any code that receives the reference via getDb() always sees the
    // patched version. Previously, if a consumer called getDb() right after
    // `db = new SQL.Database(...)` but before attachSqlite3Compatibility(), it
    // got the raw sql.js instance with no .all() / .get() / .run() shims.
    attachSqlite3Compatibility(db);

    db.run("PRAGMA foreign_keys = ON");

    logger.info(`SQLite veritabanına bağlandı: ${databasePath}`);

    createTables();
    saveDatabase();

    initialized = true;
  } catch (error) {
    logger.error(`SQLite veritabanı başlatılırken hata oluştu: ${error.message}`);
    process.exit(1);
  }
};

const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(databasePath, buffer);
  } catch (error) {
    logger.error(`Veritabanı dosyası kaydedilirken hata oluştu: ${error.message}`);
  }
};

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
      )`,
    ];

    tables.forEach((sql) => {
      try {
        db.run(sql);
      } catch (error) {
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

const attachSqlite3Compatibility = (database) => {
  const nativePrepare = database.prepare.bind(database);

  const getLastInsertRowId = () => {
    const result = database.exec("SELECT last_insert_rowid() AS id");
    return result?.[0]?.values?.[0]?.[0] ?? null;
  };

  database.get = (sql, params = [], callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    try {
      const stmt = nativePrepare(sql);
      if (params.length) stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (typeof callback === "function") {
        // FIX: Defer callback to next tick so that Promise resolvers established
        // in .then() chains are already registered before the callback fires.
        // sql.js executes synchronously — without this deferral, resolve() inside
        // a callback can fire before the Promise's internal handler queue is set up,
        // causing intermittent silent failures in some V8 microtask orderings.
        process.nextTick(() => callback.call({ lastID: null, changes: 0 }, null, row));
      }

      return row;
    } catch (error) {
      if (typeof callback === "function") {
        process.nextTick(() => callback.call({ lastID: null, changes: 0 }, error));
        return;
      }
      throw error;
    }
  };

  database.all = (sql, params = [], callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    try {
      const stmt = nativePrepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      if (typeof callback === "function") {
        // FIX: Same nextTick deferral — prevents synchronous resolve() race.
        process.nextTick(() => callback.call({ lastID: null, changes: 0 }, null, rows));
      }

      return rows;
    } catch (error) {
      if (typeof callback === "function") {
        process.nextTick(() => callback.call({ lastID: null, changes: 0 }, error));
        return;
      }
      throw error;
    }
  };

  database.run = (sql, params = [], callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    try {
      const stmt = nativePrepare(sql);
      if (params.length) stmt.bind(params);
      stmt.step();
      stmt.free();
      saveDatabase();
      const changes = database.getRowsModified();
      const lastID = getLastInsertRowId();

      if (typeof callback === "function") {
        // FIX: Same nextTick deferral.
        process.nextTick(() => callback.call({ lastID, changes }, null));
      }

      return { lastID, changes };
    } catch (error) {
      if (typeof callback === "function") {
        process.nextTick(() => callback.call({ lastID: null, changes: 0 }, error));
        return;
      }
      throw error;
    }
  };

  // These are the preferred API for new code — use these instead of callbacks.
  database.getAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      database.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

  database.allAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      database.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

  database.runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      database.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
};

// Veritabanını periyodik olarak kaydet (her 30 saniyede bir)
const autoSave = () => {
  setInterval(() => {
    saveDatabase();
  }, 30000);
};

module.exports = {
  initializeDatabase,
  saveDatabase,
  autoSave,
  // FIX: getDb() now throws with a clear message if called before init completes,
  // instead of silently returning undefined and causing "db.X is not a function"
  // errors far away from the actual source.
  getDb: () => {
    if (!initialized || !db) {
      throw new Error(
        "getDb() called before initializeDatabase() completed. " +
        "Ensure you await initializeDatabase() before setting client.db.",
      );
    }
    return db;
  },
  getSql: () => SQL,
  databasePath,
};
