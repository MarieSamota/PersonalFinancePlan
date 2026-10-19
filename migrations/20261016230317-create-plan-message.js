"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PlanMessages", {
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
      type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      text: {
        type: Sequelize.STRING(500),
        allowNull: false,
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
    await queryInterface.addIndex("PlanMessages", ["planId", "createdAt"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PlanMessages");
  },
};
