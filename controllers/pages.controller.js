const fs = require("fs/promises");
const path = require("path");
const db = require("../models/index");

const { Transaction } = db;

const ALLOWED_TYPES = ["income", "expense"];
const MAX_LENGTH = 50;
const MAX_AMOUNT_DIGITS = 15;
const MAX_ID = 2147483647;
const MAX_YEARS = 125;
const HAS_LETTER = /\p{L}/u;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

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
  const isValidId = Number.isInteger(id) && id > 0 && id <= MAX_ID;
  const transaction = isValidId ? await Transaction.findByPk(id) : null;

  if (!transaction) {
    return next();
  }

  res.render("item", { title: `Транзакция №${transaction.id}`, transaction });
}

function addForm(req, res) {
  res.render("add", { title: "Новая транзакция", errors: [], values: {} });
}

function field(value) {
  return typeof value === "string" ? value : "";
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isDateInRange(value) {
  const year = Number(value.slice(0, 4));
  const currentYear = new Date().getFullYear();
  return Math.abs(year - currentYear) <= MAX_YEARS;
}

async function addSubmit(req, res) {
  const body = req.body || {};
  const amount = field(body.amount).trim();
  const type = field(body.type);
  const category = field(body.category).trim();
  const date = field(body.date).trim();
  const description = field(body.description).trim();
  const isRecurring = body.isRecurring === "on";
  const errors = [];

  const amountNumber = Number(amount);
  if (amount === "" || Number.isNaN(amountNumber) || amountNumber <= 0) {
    errors.push("Сумма должна быть числом больше нуля");
  } else if (amount.length > MAX_LENGTH) {
    errors.push(`Сумма не должна быть длиннее ${MAX_LENGTH} символов`);
  } else if (!AMOUNT_PATTERN.test(amount)) {
    errors.push("Сумма: только цифры и точка, не больше двух знаков после точки");
  } else if (amount.split(".")[0].replace(/^0+/, "").length > MAX_AMOUNT_DIGITS) {
    errors.push(`Сумма не должна быть больше ${"9".repeat(MAX_AMOUNT_DIGITS)}`);
  }
  if (!ALLOWED_TYPES.includes(type)) {
    errors.push("Выберите тип: доход или расход");
  }
  if (category === "") {
    errors.push("Категория не может быть пустой");
  } else if (category.length > MAX_LENGTH) {
    errors.push(`Категория не должна быть длиннее ${MAX_LENGTH} символов`);
  } else if (CONTROL_CHARS.test(category)) {
    errors.push("Категория содержит недопустимые символы");
  } else if (!HAS_LETTER.test(category)) {
    errors.push("Категория должна содержать хотя бы одну букву");
  }
  if (description.length > MAX_LENGTH) {
    errors.push(`Название не должно быть длиннее ${MAX_LENGTH} символов`);
  } else if (CONTROL_CHARS.test(description)) {
    errors.push("Название содержит недопустимые символы");
  } else if (description !== "" && !HAS_LETTER.test(description)) {
    errors.push("Название должно содержать хотя бы одну букву");
  }
  if (date !== "" && !isValidDate(date)) {
    errors.push("Дата указана неверно");
  } else if (date !== "" && !isDateInRange(date)) {
    errors.push(`Год даты должен отличаться от текущего не более чем на ${MAX_YEARS} лет`);
  }

  if (errors.length > 0) {
    return res.status(400).render("add", {
      title: "Новая транзакция",
      errors,
      values: { amount, type, category, date, description, isRecurring },
    });
  }

  await Transaction.create({
    amount,
    type,
    category,
    date: date || new Date().toISOString().slice(0, 10),
    description,
    isRecurring,
  });

  res.redirect("/?auth=1");
}

async function logs(req, res) {
  const logFile = path.join(__dirname, "..", "logs", "access.log");
  let content = "";
  let problem = "";
  try {
    content = await fs.readFile(logFile, "utf8");
  } catch {
    const exists = await fs.stat(logFile).then(
      () => true,
      () => false,
    );
    if (exists) {
      problem = "Не удалось прочитать файл журнала";
    }
  }
  res.render("admin-logs", { title: "Логи запросов", content, problem });
}

module.exports = { login, index, item, addForm, addSubmit, logs };
