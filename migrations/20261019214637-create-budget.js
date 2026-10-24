"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Budgets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      limitAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING(7),
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
    await queryInterface.addIndex("Budgets", ["userId", "category", "month"], {
      unique: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Budgets");
  },
};
