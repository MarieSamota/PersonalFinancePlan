require("dotenv").config();
const mongoose = require("mongoose");
const db = require("../models");
const Goal = require("../models/mongo/Goal");

function demoGoals(userId) {
  return [
    {
      userId,
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
      userId,
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
      userId,
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
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Укажите email пользователя: npm run mongo:seed -- <email>");
  }

  const user = await db.User.findOne({ where: { email } });
  if (!user) {
    throw new Error(`Пользователь ${email} не найден в PostgreSQL`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  await Goal.deleteMany({ userId: user.id });
  const goals = await Goal.insertMany(demoGoals(user.id));
  console.log(`Добавлено целей: ${goals.length} для ${email} (userId ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await db.sequelize.close();
  });
