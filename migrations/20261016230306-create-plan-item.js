"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PlanItems", {
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
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      addedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      paidById: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
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
    await queryInterface.addIndex("PlanItems", ["planId"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PlanItems");
  },
};
