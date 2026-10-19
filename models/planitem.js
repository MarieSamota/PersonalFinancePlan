"use strict";
const { Model } = require("sequelize");
const { toNumber } = require("../utils/validators");

module.exports = (sequelize, DataTypes) => {
  class PlanItem extends Model {
    static associate(models) {
      PlanItem.belongsTo(models.SharedPlan, {
        as: "plan",
        foreignKey: "planId",
      });
    }
  }
  PlanItem.init(
    {
      planId: {
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
          notNull: { msg: "Название статьи обязательно" },
          isString(value) {
            if (typeof value !== "string") {
              throw new Error("Название статьи должно быть строкой");
            }
          },
          notEmpty: { msg: "Название статьи обязательно" },
          len: {
            args: [0, 100],
            msg: "Название статьи – не длиннее 100 символов",
          },
        },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return toNumber(this.getDataValue("amount"));
        },
        validate: {
          notNull: { msg: "Сумма статьи обязательна" },
          amountFormat(value) {
            if (!/^-?\d+(\.\d{1,2})?$/.test(String(value))) {
              throw new Error(
                "Сумма статьи должна быть числом (не больше 2 знаков после запятой)",
              );
            }
          },
          min: { args: [0.01], msg: "Сумма статьи должна быть больше нуля" },
          max: { args: [9999999999], msg: "Сумма статьи слишком большая" },
        },
      },
      addedById: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paidById: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "PlanItem",
    },
  );
  return PlanItem;
};
