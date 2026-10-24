const Joi = require("joi");
const { money, month } = require("./common");

const fields = {
  category: Joi.string().trim().max(100),
  limitAmount: money,
  month,
};

const budgetSchema = Joi.object({
  category: fields.category.required(),
  limitAmount: fields.limitAmount.required(),
  month: fields.month.required(),
});

const budgetPatchSchema = Joi.object(fields).min(1);

module.exports = { budgetSchema, budgetPatchSchema };
