"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SharedPlans", "closedAt", {
      type: Sequelize.DATE,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("SharedPlans", "closedAt");
  },
};
