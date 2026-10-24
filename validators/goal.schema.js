const Joi = require("joi");
const { money, dateOnly } = require("./common");

const fields = {
  title: Joi.string().trim().max(100),
  targetAmount: money.min(1),
  deadline: dateOnly.allow(null),
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(50))
    .custom((tags) => [...new Set(tags)]),
};

const goalSchema = Joi.object({
  ...fields,
  title: fields.title.required(),
  targetAmount: fields.targetAmount.required(),
  deadline: fields.deadline.default(null),
  tags: fields.tags.default([]),
});

const goalPatchSchema = Joi.object(fields).min(1);

const contributionFields = {
  amount: money,
  date: dateOnly,
  note: Joi.string().trim().allow("").max(200),
};

const contributionSchema = Joi.object({
  ...contributionFields,
  amount: contributionFields.amount.required(),
});

const contributionPatchSchema = Joi.object(contributionFields).min(1);

const tagSchema = Joi.object({
  tag: Joi.string().trim().lowercase().max(50).required(),
});

module.exports = {
  goalSchema,
  goalPatchSchema,
  contributionSchema,
  contributionPatchSchema,
  tagSchema,
};
