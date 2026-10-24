const { Op } = require("sequelize");
const db = require("../models/index");
const { parseId } = require("../utils/validators");

const { Transaction } = db;

function badId(res) {
  return res.status(400).json({ error: "Некорректный id" });
}

function transactionNotFound(res) {
  return res.status(404).json({ error: "Транзакция не найдена" });
}

async function getAll(req, res) {
  const { type, category, search } = req.query;

  const where = { userId: req.user.id };
  if (typeof type === "string" && type !== "") {
    where.type = type;
  }
  if (typeof category === "string" && category !== "") {
    where.category = { [Op.iLike]: category };
  }
  if (typeof search === "string" && search.trim() !== "") {
    const escaped = search.trim().replace(/[\\%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    where[Op.or] = [
      { category: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } },
    ];
  }

  const transactions = await Transaction.findAll({
    where,
    order: [["id", "ASC"]],
  });
  res.status(200).json(transactions);
}

async function getOne(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const transaction = await Transaction.findOwn(id, req.user.id);
  if (!transaction) {
    return transactionNotFound(res);
  }

  res.status(200).json(transaction);
}

async function create(req, res) {
  const transaction = await Transaction.create({
    ...req.body,
    userId: req.user.id,
  });
  res
    .status(201)
    .location(`/transactions/${transaction.id}`)
    .json(transaction);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const transaction = await Transaction.findOwn(id, req.user.id);
  if (!transaction) {
    return transactionNotFound(res);
  }

  await transaction.update(req.body);
  res.status(200).json(transaction);
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const deletedCount = await Transaction.destroy({
    where: { id, userId: req.user.id },
  });
  if (deletedCount === 0) {
    return transactionNotFound(res);
  }

  res.status(204).end();
}

module.exports = { getAll, getOne, create, update, remove };
