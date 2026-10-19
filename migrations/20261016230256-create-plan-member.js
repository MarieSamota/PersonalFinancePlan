"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PlanMembers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      planId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "SharedPlans", key: "id" },
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("PlanMembers", ["planId", "userId"], {
      unique: true,
    });
    await queryInterface.addIndex("PlanMembers", ["userId"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PlanMembers");
  },
};
