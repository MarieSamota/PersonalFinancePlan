"use strict";
const { Model } = require("sequelize");
const { toNumber } = require("../utils/validators");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {}

    static findOwn(id, userId) {
      return Transaction.findOne({ where: { id, userId } });
    }
  }
  Transaction.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL,
        get() {
          return toNumber(this.getDataValue("amount"));
        },
      },
      type: DataTypes.STRING,
      category: DataTypes.STRING,
      date: DataTypes.DATEONLY,
      description: DataTypes.STRING,
      isRecurring: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Transaction",
    },
  );
  return Transaction;
};
