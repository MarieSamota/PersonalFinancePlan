const { Op } = require("sequelize");
const db = require("../models/index");

const { Transaction } = db;

const ALLOWED_TYPES = ["income", "expense"];

function validateTransaction(body) {
  const errors = [];

  if (body.amount === undefined) {
    errors.push("Поле amount обязательно");
  } else if (typeof body.amount !== "number" || Number.isNaN(body.amount)) {
    errors.push("Поле amount должно быть числом");
  } else if (body.amount <= 0) {
    errors.push("Поле amount должно быть больше нуля");
  }

  if (body.type === undefined) {
    errors.push("Поле type обязательно");
  } else if (!ALLOWED_TYPES.includes(body.type)) {
    errors.push("Поле type должно быть 'income' или 'expense'");
  }

  if (body.category === undefined) {
    errors.push("Поле category обязательно");
  } else if (typeof body.category !== "string" || body.category.trim() === "") {
    errors.push("Поле category должно быть непустой строкой");
  }

  if (body.date !== undefined && Number.isNaN(Date.parse(body.date))) {
    errors.push("Поле date должно быть датой в формате ГГГГ-ММ-ДД");
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push("Поле description должно быть строкой");
  }

  return errors;
}

function buildTransactionData(body) {
  return {
    amount: body.amount,
    type: body.type,
    category: body.category.trim(),
    date:
      body.date !== undefined
        ? body.date
        : new Date().toISOString().slice(0, 10),
    description: body.description !== undefined ? body.description : "",
    isRecurring: body.isRecurring !== undefined ? body.isRecurring : false,
  };
}

async function getAll(req, res) {
  const { type, category } = req.query;

  const where = {};
  if (type !== undefined) {
    where.type = type;
  }
  if (category !== undefined) {
    where.category = { [Op.iLike]: category };
  }

  const transactions = await Transaction.findAll({ where });
  res.status(200).json(transactions);
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть целым числом" });
  }

  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(200).json(transaction);
}

async function create(req, res) {
  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const created = await Transaction.create(buildTransactionData(req.body));
  res.status(201).json(created);
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть целым числом" });
  }

  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const [, updated] = await Transaction.update(buildTransactionData(req.body), {
    where: { id },
    returning: true,
  });

  if (updated.length === 0) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(200).json(updated[0]);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть числом" });
  }

  const deletedCount = await Transaction.destroy({ where: { id } });
  if (deletedCount === 0) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(204).end();
}

module.exports = { getAll, getOne, create, update, remove };
