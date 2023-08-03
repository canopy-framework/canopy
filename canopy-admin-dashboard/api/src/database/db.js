const path  = require("path");
const sqlite = require("sqlite3").verbose();
const filepath = path.join(__dirname, './dashboard_storage.db');

function createDbConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite.Database(filepath, (error) => {
      if (error) {
        reject(error.message);
      } else {
        createTable(db);
        resolve(db);
      }
    });
  });
}

function createTable(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS cdn_distributions
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    distributionId TEXT NOT NULL,
    realtimeConfigId JSON NOT NULL
  );
`);
}


module.exports = { createDbConnection };