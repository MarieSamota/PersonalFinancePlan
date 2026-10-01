const fs = require("fs/promises");
const path = require("path");
const db = require("../models/index");

const { Transaction } = db;

const ALLOWED_TYPES = ["income", "expense"];

function login(req, res) {
  res.render("login", { title: "Вход" });
}

async function index(req, res) {
  const transactions = await Transaction.findAll({
    order: [
      ["date", "DESC"],
      ["id", "DESC"],
    ],
  });
  res.render("index", { title: "Транзакции", transactions });
}

async function item(req, res, next) {
  const id = Number(req.params.id);
  const transaction = Number.isInteger(id)
    ? await Transaction.findByPk(id)
    : null;

  if (!transaction) {
    return next();
  }

  res.render("item", { title: `Транзакция №${transaction.id}`, transaction });
}

function addForm(req, res) {
  res.render("add", { title: "Новая транзакция", errors: [], values: {} });
}

async function addSubmit(req, res) {
  const { amount, type, category, date, description, isRecurring } = req.body;
  const errors = [];

  const amountNumber = Number(amount);
  if (amount === "" || Number.isNaN(amountNumber) || amountNumber <= 0) {
    errors.push("Сумма должна быть числом больше нуля");
  }
  if (!ALLOWED_TYPES.includes(type)) {
    errors.push("Выберите тип: доход или расход");
  }
  if (!category || category.trim() === "") {
    errors.push("Категория не может быть пустой");
  }

  if (errors.length > 0) {
    return res.status(400).render("add", {
      title: "Новая транзакция",
      errors,
      values: req.body,
    });
  }

  await Transaction.create({
    amount: amountNumber,
    type,
    category: category.trim(),
    date: date || new Date().toISOString().slice(0, 10),
    description: description || "",
    isRecurring: isRecurring === "on",
  });

  res.redirect("/?auth=1");
}

async function logs(req, res) {
  let content = "";
  try {
    content = await fs.readFile(
      path.join(__dirname, "..", "logs", "access.log"),
      "utf8",
    );
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  res.render("admin-logs", { title: "Логи запросов", content });
}

module.exports = { login, index, item, addForm, addSubmit, logs };