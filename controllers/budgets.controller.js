const { Op } = require("sequelize");
const db = require("../models/index");
const { parseId } = require("../utils/validators");

const { Budget } = db;

function badId(res) {
  return res.status(400).json({ error: "Некорректный id" });
}

function budgetNotFound(res) {
  return res.status(404).json({ error: "Бюджет не найден" });
}

function budgetConflict(res, category, month) {
  return res.status(409).json({
    error: `Бюджет на категорию «${category}» за ${month} уже существует`,
  });
}

function findDuplicate(userId, category, month, exceptId) {
  const where = { userId, category, month };
  if (exceptId) {
    where.id = { [Op.ne]: exceptId };
  }
  return Budget.findOne({ where });
}

async function getAll(req, res) {
  const { month, category } = req.query;

  const where = { userId: req.user.id };
  if (typeof month === "string" && month !== "") {
    where.month = month;
  }
  if (typeof category === "string" && category.trim() !== "") {
    where.category = { [Op.iLike]: category.trim() };
  }

  const budgets = await Budget.findAll({
    where,
    order: [
      ["month", "DESC"],
      ["category", "ASC"],
    ],
  });
  res.status(200).json(budgets);
}

async function getOne(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const budget = await Budget.findOwn(id, req.user.id);
  if (!budget) {
    return budgetNotFound(res);
  }

  res.status(200).json(budget);
}

async function create(req, res) {
  const { category, month } = req.body;
  if (await findDuplicate(req.user.id, category, month)) {
    return budgetConflict(res, category, month);
  }

  const budget = await Budget.create({ ...req.body, userId: req.user.id });
  res.status(201).location(`/budgets/${budget.id}`).json(budget);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const budget = await Budget.findOwn(id, req.user.id);
  if (!budget) {
    return budgetNotFound(res);
  }

  const category = req.body.category ?? budget.category;
  const month = req.body.month ?? budget.month;
  if (await findDuplicate(req.user.id, category, month, budget.id)) {
    return budgetConflict(res, category, month);
  }

  await budget.update(req.body);
  res.status(200).json(budget);
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const deletedCount = await Budget.destroy({
    where: { id, userId: req.user.id },
  });
  if (deletedCount === 0) {
    return budgetNotFound(res);
  }

  res.status(204).end();
}

module.exports = { getAll, getOne, create, update, remove };
