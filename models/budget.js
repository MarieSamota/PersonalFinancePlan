"use strict";
const { Model } = require("sequelize");
const { toNumber } = require("../utils/validators");

module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    static associate(models) {}

    static findOwn(id, userId) {
      return Budget.findOne({ where: { id, userId } });
    }
  }
  Budget.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      limitAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return toNumber(this.getDataValue("limitAmount"));
        },
      },
      month: {
        type: DataTypes.STRING(7),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Budget",
    },
  );
  return Budget;
};
