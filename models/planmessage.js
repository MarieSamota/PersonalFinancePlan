"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PlanMessage extends Model {
    static associate(models) {
      PlanMessage.belongsTo(models.SharedPlan, {
        as: "plan",
        foreignKey: "planId",
      });
      PlanMessage.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    }
  }
  PlanMessage.init(
    {
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          isIn: {
            args: [["message", "event"]],
            msg: "Тип записи – message или event",
          },
        },
      },
      text: {
        type: DataTypes.STRING(500),
        allowNull: false,
        set(value) {
          this.setDataValue(
            "text",
            typeof value === "string" ? value.trim() : value,
          );
        },
        validate: {
          notNull: { msg: "Сообщение не может быть пустым" },
          isString(value) {
            if (typeof value !== "string") {
              throw new Error("Сообщение должно быть строкой");
            }
          },
          notEmpty: { msg: "Сообщение не может быть пустым" },
          len: {
            args: [0, 500],
            msg: "Сообщение – не длиннее 500 символов",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "PlanMessage",
    },
  );
  return PlanMessage;
};
