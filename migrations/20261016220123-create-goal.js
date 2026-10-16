"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Goals", {
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
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      targetAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      deadline: {
        type: Sequelize.DATEONLY,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING(50)),
        allowNull: false,
        defaultValue: [],
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
    await queryInterface.addIndex("Goals", ["userId", "deadline"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Goals");
  },
};
