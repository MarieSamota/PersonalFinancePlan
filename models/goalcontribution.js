"use strict";
const { Model } = require("sequelize");
const { toNumber } = require("../utils/validators");

module.exports = (sequelize, DataTypes) => {
  class GoalContribution extends Model {
    static associate(models) {
      GoalContribution.belongsTo(models.Goal, {
        as: "goal",
        foreignKey: "goalId",
      });
    }
  }
  GoalContribution.init(
    {
      goalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return toNumber(this.getDataValue("amount"));
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: () => new Date().toISOString().slice(0, 10),
      },
      note: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
      },
    },
    {
      sequelize,
      modelName: "GoalContribution",
    },
  );
  return GoalContribution;
};
