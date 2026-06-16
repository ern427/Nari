const logger = require("./logger");

const get = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        logger.error(`[db.get] ${error.message}`);
        return reject(error);
      }
      resolve(row);
    });
  });

const all = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        logger.error(`[db.all] ${error.message}`);
        return reject(error);
      }
      resolve(rows || []);
    });
  });

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        logger.error(`[db.run] ${error.message}`);
        return reject(error);
      }
      resolve(this);
    });
  });

module.exports = {
  get,
  all,
  run,
};