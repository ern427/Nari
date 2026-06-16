const logger = require("./logger");
const { saveDatabase } = require("../database/sqlite");

// sql.js için wrapper fonksiyonlar
// Promise döndürmüyor, direkt senkron çalışıyor
// Mevcut async/await kodu için Promise.resolve() ile sarmalı

const get = async (db, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    
    return row;
  } catch (error) {
    logger.error(`[db.get] ${error.message}`);
    throw error;
  }
};

const all = async (db, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    
    return rows || [];
  } catch (error) {
    logger.error(`[db.all] ${error.message}`);
    throw error;
  }
};

const run = async (db, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    stmt.step();
    stmt.free();
    
    // Veritabanı değiştiğinden, diskte kaydet
    saveDatabase();
    
    return { changes: db.getRowsModified() };
  } catch (error) {
    logger.error(`[db.run] ${error.message}`);
    throw error;
  }
};

module.exports = {
  get,
  all,
  run,
};