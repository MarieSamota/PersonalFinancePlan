"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Transactions", "userId", {
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onDelete: "CASCADE",
    });
    await queryInterface.sequelize.query(
      'UPDATE "Transactions" SET "userId" = (SELECT "id" FROM "Users" WHERE "isVerified" = true ORDER BY "id" LIMIT 1)',
    );
    await queryInterface.bulkDelete("Transactions", { userId: null });
    await queryInterface.changeColumn("Transactions", "userId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addIndex("Transactions", ["userId", "date"]);
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Transactions", "userId");
  },
};
