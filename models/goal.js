"use strict";
const { Model } = require("sequelize");
const { isDateOnly, toNumber } = require("../utils/validators");

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
        set(value) {
          this.setDataValue(
            "title",
            typeof value === "string" ? value.trim() : value,
          );
        },
        validate: {
          notNull: { msg: "Название цели обязательно" },
          isString(value) {
            if (typeof value !== "string") {
              throw new Error("Название цели должно быть строкой");
            }
          },
          notEmpty: { msg: "Название цели обязательно" },
          len: {
            args: [0, 100],
            msg: "Название цели – не длиннее 100 символов",
          },
        },
      },
      targetAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return toNumber(this.getDataValue("targetAmount"));
        },
        validate: {
          notNull: { msg: "Сумма цели обязательна" },
          isDecimal: { msg: "Сумма цели должна быть числом" },
          min: { args: [1], msg: "Сумма цели должна быть не меньше 1" },
          max: { args: [9999999999], msg: "Сумма цели слишком большая" },
        },
      },
      deadline: {
        type: DataTypes.DATEONLY,
        validate: {
          dateFormat(value) {
            if (!isDateOnly(value)) {
              throw new Error("Срок должен быть в формате ГГГГ-ММ-ДД");
            }
          },
        },
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
        allowNull: false,
        defaultValue: [],
        validate: {
          tagLength(value) {
            if (value.some((tag) => tag.length > 50)) {
              throw new Error("Тег – не длиннее 50 символов");
            }
          },
        },
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
