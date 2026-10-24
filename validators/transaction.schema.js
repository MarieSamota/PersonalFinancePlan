const Joi = require("joi");
const { money, dateOnly, today } = require("./common");

const fields = {
  amount: money,
  type: Joi.string().valid("income", "expense"),
  category: Joi.string().trim().max(255),
  date: dateOnly,
  description: Joi.string().trim().allow("").max(255),
  isRecurring: Joi.boolean().strict(),
};

const transactionSchema = Joi.object({
  ...fields,
  amount: fields.amount.required(),
  type: fields.type.required(),
  category: fields.category.required(),
  date: fields.date.default(today),
  description: fields.description.default(""),
  isRecurring: fields.isRecurring.default(false),
});

const transactionPatchSchema = Joi.object(fields).min(1);

module.exports = { transactionSchema, transactionPatchSchema };
