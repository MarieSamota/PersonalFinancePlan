"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {}
  }
  Transaction.init(
    {
      amount: DataTypes.DECIMAL,
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
