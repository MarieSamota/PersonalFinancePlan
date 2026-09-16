"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Transactions", [
      {
        amount: 250,
        type: "income",
        category: "Поступления",
        date: "2026-09-01",
        description: "Стипендия",
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        amount: 20,
        type: "expense",
        category: "Продукты",
        date: "2026-09-02",
        description: "Алми",
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        amount: 51,
        type: "expense",
        category: "Транспорт",
        date: "2026-09-02",
        description: "Проездной билет",
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Transactions", null, {});
  },
};
