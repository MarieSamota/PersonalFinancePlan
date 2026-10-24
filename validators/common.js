const Joi = require("joi");
const { isDateOnly } = require("../utils/validators");

const money = Joi.number().strict().positive().precision(2).max(9999999999);

const dateOnly = Joi.string().custom((value, helpers) =>
  isDateOnly(value) ? value : helpers.error("date.format"),
);

const month = Joi.string().pattern(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, "month");

function today() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { money, dateOnly, month, today };
