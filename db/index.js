const sqlite3 = require('sqlite3')
const { sleep } = require('../util');
sqlite3.Database = new Proxy(sqlite3.Database, {
  async construct(target, args) {
    if (args[0].includes("vfs=zstd")) {
      const tempDb = new target(':memory:');
      let extensionLoaded = false;
      tempDb.loadExtension('./zstd_vfs.so', (i) => {
        if (i === null) {
          console.log("ZSTD VFS loaded");
          extensionLoaded = true;
        } else {
          throw new Error("ZSTD VFS load failed.");
        }
      });
      while (extensionLoaded == false) { await sleep(100); }
      tempDb.close();
    }
    const db = new target(...args);
    return db;
  }
});

const { Sequelize } = require("sequelize");
const db = new Sequelize({
  dialect: "sqlite",
  storage: "file:./db.sqlite",
  dialectOptions: {
    mode: sqlite3.OPEN_URI | sqlite3.OPEN_READWRITE,
  },
  logging: false,
});

module.exports = db;
