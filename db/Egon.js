const { DataTypes } = require("sequelize");
const db = require("./");

const Egon = db.define(
  "egon",
  {
    egon: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    region: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    province: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    street: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    number: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    color: {
      type: DataTypes.TEXT,
    },
    peakVel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    below300Mbps: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    indexes: [
      { unique: false, fields: ["province", "city"] },
      { unique: false, fields: ["province", "city", "street"] },
    ],
  },
);

module.exports = { Egon };
