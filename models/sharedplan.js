"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SharedPlan extends Model {
    static associate(models) {
      SharedPlan.hasMany(models.PlanMember, {
        as: "members",
        foreignKey: "planId",
      });
      SharedPlan.hasMany(models.PlanItem, {
        as: "items",
        foreignKey: "planId",
      });
      SharedPlan.hasMany(models.PlanMessage, {
        as: "messages",
        foreignKey: "planId",
      });
    }
  }
  SharedPlan.init(
    {
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
          notNull: { msg: "Название купийки обязательно" },
          isString(value) {
            if (typeof value !== "string") {
              throw new Error("Название купийки должно быть строкой");
            }
          },
          notEmpty: { msg: "Название купийки обязательно" },
          len: {
            args: [0, 100],
            msg: "Название купийки – не длиннее 100 символов",
          },
        },
      },
      inviteCode: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      closedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "SharedPlan",
    },
  );
  return SharedPlan;
};
