"use strict";
const { Model } = require("sequelize");
const { toNumber } = require("../utils/validators");

module.exports = (sequelize, DataTypes) => {
  class Goal extends Model {
    static associate(models) {
      Goal.hasMany(models.GoalContribution, {
        as: "contributions",
        foreignKey: "goalId",
      });
    }

    static findOwn(id, userId) {
      return Goal.findOne({
        where: { id, userId },
        include: "contributions",
        order: [["contributions", "id", "ASC"]],
      });
    }

    isReached() {
      return this.savedAmount >= this.targetAmount;
    }
  }
  Goal.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      targetAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return toNumber(this.getDataValue("targetAmount"));
        },
      },
      deadline: DataTypes.DATEONLY,
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
        allowNull: false,
        defaultValue: [],
      },
      savedAmount: {
        type: DataTypes.VIRTUAL,
        get() {
          const contributions = this.contributions ?? [];
          const total = contributions.reduce((sum, c) => sum + c.amount, 0);
          return Math.round(total * 100) / 100;
        },
      },
      progress: {
        type: DataTypes.VIRTUAL,
        get() {
          return Math.min(
            100,
            Math.round((this.savedAmount / this.targetAmount) * 100),
          );
        },
      },
      status: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.isReached() ? "reached" : "active";
        },
      },
    },
    {
      sequelize,
      modelName: "Goal",
    },
  );
  return Goal;
};
