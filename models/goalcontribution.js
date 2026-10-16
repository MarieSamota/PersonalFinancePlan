"use strict";
const { Model } = require("sequelize");
const { isDateOnly, toNumber } = require("../utils/validators");

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
        validate: {
          notNull: { msg: "Сумма взноса обязательна" },
          isDecimal: { msg: "Сумма взноса должна быть числом" },
          min: { args: [0.01], msg: "Сумма взноса должна быть больше нуля" },
          max: { args: [9999999999], msg: "Сумма взноса слишком большая" },
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: () => new Date().toISOString().slice(0, 10),
        validate: {
          notNull: { msg: "Дата взноса обязательна" },
          dateFormat(value) {
            if (!isDateOnly(value)) {
              throw new Error("Дата взноса должна быть в формате ГГГГ-ММ-ДД");
            }
          },
        },
      },
      note: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
        set(value) {
          this.setDataValue(
            "note",
            typeof value === "string" ? value.trim() : value,
          );
        },
        validate: {
          notNull: { msg: "Комментарий к взносу не может быть null" },
          len: {
            args: [0, 200],
            msg: "Комментарий к взносу – не длиннее 200 символов",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "GoalContribution",
    },
  );
  return GoalContribution;
};
