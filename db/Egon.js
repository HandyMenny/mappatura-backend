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
    // 0 = not included, 1 = OF, 2 = TIM
    status_p1g: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    walkin_connetti: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    color_2021: {
      type: DataTypes.TEXT,
    },
    peakSpeed_2021: {
      type: DataTypes.INTEGER,
    },
    below300Mbps_2021: {
      type: DataTypes.INTEGER,
    },
    class19_2020: {
      type: DataTypes.TEXT,
    },
    class22_2020: {
      type: DataTypes.TEXT,
    },
    cat18_2019: {
      type: DataTypes.INTEGER,
    },
    cat21_2019: {
      type: DataTypes.INTEGER,
    },
    speed20_2017: {
      type: DataTypes.INTEGER,
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
