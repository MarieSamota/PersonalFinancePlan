require("dotenv").config();
const db = require("../models");

const { User, Goal, GoalContribution, sequelize } = db;

const DEMO_GOALS = [
  {
    title: "Отпуск в Грузии",
    targetAmount: 2000,
    deadline: "2027-06-01",
    tags: ["путешествия", "лето"],
    contributions: [
      { amount: 150, date: "2026-08-05", note: "с зарплаты" },
      { amount: 200, date: "2026-09-05", note: "с зарплаты" },
      { amount: 120, date: "2026-10-05", note: "со стипендии" },
    ],
  },
  {
    title: "Новый ноутбук",
    targetAmount: 2500,
    deadline: "2027-01-15",
    tags: ["техника", "учёба"],
    contributions: [
      { amount: 300, date: "2026-09-10", note: "подработка" },
      { amount: 250, date: "2026-10-10", note: "подработка" },
    ],
  },
  {
    title: "Финансовая подушка",
    targetAmount: 1000,
    deadline: "2026-12-31",
    tags: ["резерв"],
    contributions: [
      { amount: 400, date: "2026-08-20" },
      { amount: 350, date: "2026-09-20" },
      { amount: 300, date: "2026-10-01" },
    ],
  },
];

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Укажите email пользователя: npm run goals:seed -- <email>");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error(`Пользователь ${email} не найден`);
  }

  await sequelize.transaction(async (transaction) => {
    await Goal.destroy({ where: { userId: user.id }, transaction });
    for (const { contributions, ...goalData } of DEMO_GOALS) {
      const goal = await Goal.create(
        { ...goalData, userId: user.id },
        { transaction },
      );
      await GoalContribution.bulkCreate(
        contributions.map((c) => ({ ...c, goalId: goal.id })),
        { validate: true, transaction },
      );
    }
  });

  console.log(
    `Добавлено целей: ${DEMO_GOALS.length} для ${email} (userId ${user.id})`,
  );
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
