"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PlanMember extends Model {
    static associate(models) {
      PlanMember.belongsTo(models.SharedPlan, {
        as: "plan",
        foreignKey: "planId",
      });
      PlanMember.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    }
  }
  PlanMember.init(
    {
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PlanMember",
    },
  );
  return PlanMember;
};
