const { Sequelize } = require("sequelize");
const db = new Sequelize({
  dialect: "sqlite",
  storage: "./db.sqlite",
  logging: false,
});

module.exports = db;
