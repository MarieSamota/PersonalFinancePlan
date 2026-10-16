"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("GoalContributions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      goalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Goals", key: "id" },
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: "",
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
    await queryInterface.addIndex("GoalContributions", ["goalId"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("GoalContributions");
  },
};
