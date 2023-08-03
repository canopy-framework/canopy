const db = require("./db");
const tableName = 'cdn_distributions';

function listAllDistributions() {
  return new Promise((resolve, reject) => {
    db.createDbConnection()
      .then((connection) => {
        connection.all(`SELECT * FROM ${tableName}`, (error, rows) => {
          if (error) {
            reject(error.message);
          } else {
            connection.close();
            resolve(rows);
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function saveDistribution(distributionId, realtimeConfigId) {
  return new Promise((resolve, reject) => {
    db.createDbConnection()
      .then((connection) => {
        connection.run(
          `INSERT INTO ${tableName} (distributionId, realtimeConfigId) VALUES (?, ?)`,
          [distributionId, realtimeConfigId],
          function (error) {
            if (error) {
              reject(error.message);
            } else {
              connection.close();
              resolve(`Successfully saved new distribution with id: ${this.lastID}`);
            }
          }
        );
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function deleteDistribution(id) {
  return new Promise((resolve, reject) => {
    db.createDbConnection()
      .then((connection) => {
        connection.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], (error) => {
          if (error) {
            reject(error.message);
          } else {
            connection.close();
            resolve(`Successfully deleted distribution with id: ${id}`);
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function deleteAllDistributions() {
  return new Promise((resolve, reject) => {
    db.createDbConnection()
      .then((connection) => {
        connection.run(`DELETE FROM ${tableName}`, (error) => {
          if (error) {
            reject(error.message);
          } else {
            connection.close();
            resolve("Successfully deleted all distributions");
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = { 
  listAllDistributions, 
  saveDistribution, 
  deleteDistribution, 
  deleteAllDistributions 
};