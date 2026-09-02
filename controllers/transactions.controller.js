const model = require("../models/transactions.model");

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
  };
}

function getAll(req, res) {
  let result = model.getAll();

  const { type, category } = req.query;

  if (type !== undefined) {
    result = result.filter((t) => t.type === type);
  }
  if (category !== undefined) {
    result = result.filter(
      (t) => t.category.toLowerCase() === category.toLowerCase(),
    );
  }

  res.status(200).json(result);
}

function getOne(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть целым числом" });
  }

  const transaction = model.getById(id);
  if (!transaction) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(200).json(transaction);
}

function create(req, res) {
  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const created = model.create(buildTransactionData(req.body));
  res.status(201).json(created);
}

function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть целым числом" });
  }

  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const updated = model.update(id, buildTransactionData(req.body));
  if (!updated) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(200).json(updated);
}

function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id должен быть числом" });
  }

  const deleted = model.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: "Транзакция не найдена" });
  }

  res.status(204).end();
}

module.exports = { getAll, getOne, create, update, remove };
