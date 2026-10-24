"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [user] = await queryInterface.sequelize.query(
      'SELECT "id" FROM "Users" WHERE "isVerified" = true ORDER BY "id" LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT },
    );
    if (!user) {
      throw new Error("Сначала зарегистрируйте и подтвердите пользователя");
    }

    await queryInterface.bulkInsert("Transactions", [
      {
        amount: 250,
        type: "income",
        category: "Поступления",
        date: "2026-09-01",
        description: "Стипендия",
        isRecurring: true,
        userId: user.id,
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
        userId: user.id,
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
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Transactions", null, {});
  },
};
