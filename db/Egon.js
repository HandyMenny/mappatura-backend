const { DataTypes } = require("sequelize");
const db = require("./");

const Egon = db.define(
  "egon",
  {
    egon: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    cityId: {
      type: DataTypes.INTEGER,
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
    peakSpeed: {
      type: DataTypes.INTEGER,
    },
    below300Mbps: {
      type: DataTypes.INTEGER,
    },
    bando1Giga: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    indexes: [
      { unique: false, fields: ["cityId", "street"] },
    ],
  },
);

const City = db.define(
  "city",
  {
    id: {
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
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  },
  {
    timestamps: false,
    indexes: [
      { unique: true, fields: ["province", "name"] },
    ],
  },
);

Egon.belongsTo(City, {
  foreignKey: "cityId",
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

module.exports = { Egon, City };
