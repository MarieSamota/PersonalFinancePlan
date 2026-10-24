const { Op } = require("sequelize");
const db = require("../models/index");
const { parseId } = require("../utils/validators");

const { Goal, GoalContribution, sequelize } = db;

const MAX_PAGE = 100000;

function normalizeTag(tag) {
  return String(tag).trim().toLowerCase();
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, "\\$&");
}

function savedAmountCompare(operator) {
  return sequelize.literal(
    `(SELECT COALESCE(SUM("amount"), 0) FROM "GoalContributions" WHERE "GoalContributions"."goalId" = "Goal"."id") ${operator} "Goal"."targetAmount"`,
  );
}

function badId(res) {
  return res.status(400).json({ error: "Некорректный id" });
}

function goalNotFound(res) {
  return res.status(404).json({ error: "Цель не найдена" });
}

async function getAll(req, res) {
  const { tag, search, status } = req.query;
  const page = Math.min(
    MAX_PAGE,
    Math.max(1, Number.parseInt(req.query.page, 10) || 1),
  );
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
  );

  const where = { userId: req.user.id };
  if (typeof tag === "string" && tag.trim() !== "") {
    where.tags = { [Op.contains]: [normalizeTag(tag)] };
  }
  if (typeof search === "string" && search.trim() !== "") {
    where.title = { [Op.iLike]: `%${escapeLike(search.trim())}%` };
  }
  if (status === "reached" || status === "active") {
    where[Op.and] = [savedAmountCompare(status === "reached" ? ">=" : "<")];
  }

  const { rows, count } = await Goal.findAndCountAll({
    where,
    include: "contributions",
    distinct: true,
    order: [
      ["deadline", "ASC"],
      ["createdAt", "ASC"],
      ["contributions", "id", "ASC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });

  res.status(200).json({ goals: rows, total: count, page, limit });
}

async function stats(req, res) {
  const months = await GoalContribution.findAll({
    attributes: [
      [
        sequelize.fn("to_char", sequelize.col("GoalContribution.date"), "YYYY-MM"),
        "month",
      ],
      [sequelize.fn("SUM", sequelize.col("GoalContribution.amount")), "total"],
      [sequelize.fn("COUNT", sequelize.col("GoalContribution.id")), "count"],
    ],
    include: {
      association: "goal",
      attributes: [],
      where: { userId: req.user.id },
    },
    group: ["month"],
    order: [[sequelize.literal('"month"'), "ASC"]],
    raw: true,
  });

  res.status(200).json(
    months.map((m) => ({
      month: m.month,
      total: Number(m.total),
      count: Number(m.count),
    })),
  );
}

async function getOne(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(200).json(goal);
}

async function create(req, res) {
  const created = await Goal.create({ ...req.body, userId: req.user.id });
  const goal = await Goal.findOwn(created.id, req.user.id);
  res.status(201).location(`/goals/${goal.id}`).json(goal);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  await goal.update(req.body);
  res.status(200).json(goal);
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  await goal.destroy();
  res.status(204).end();
}

async function addContribution(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  await GoalContribution.create({ ...req.body, goalId: goal.id });
  res.status(201).json(await Goal.findOwn(id, req.user.id));
}

async function updateContribution(req, res) {
  const id = parseId(req.params.id);
  const contributionId = parseId(req.params.contributionId);
  if (!id || !contributionId) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  const contribution = goal?.contributions.find((c) => c.id === contributionId);
  if (!contribution) {
    return res.status(404).json({ error: "Цель или взнос не найдены" });
  }

  await contribution.update(req.body);
  res.status(200).json(goal);
}

async function removeContribution(req, res) {
  const id = parseId(req.params.id);
  const contributionId = parseId(req.params.contributionId);
  if (!id || !contributionId) {
    return badId(res);
  }

  const goal = await Goal.findOwn(id, req.user.id);
  const contribution = goal?.contributions.find((c) => c.id === contributionId);
  if (!contribution) {
    return res.status(404).json({ error: "Цель или взнос не найдены" });
  }

  await contribution.destroy();
  res.status(200).json(await Goal.findOwn(id, req.user.id));
}

async function addTag(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const { tag } = req.body;

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  if (!goal.tags.includes(tag)) {
    await goal.update({ tags: [...goal.tags, tag] });
  }
  res.status(200).json(goal);
}

async function removeTag(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return badId(res);
  }

  const tag = normalizeTag(req.params.tag);

  const goal = await Goal.findOwn(id, req.user.id);
  if (!goal || !goal.tags.includes(tag)) {
    return res.status(404).json({ error: "Цель или тег не найдены" });
  }

  await goal.update({ tags: goal.tags.filter((t) => t !== tag) });
  res.status(200).json(goal);
}

module.exports = {
  getAll,
  stats,
  getOne,
  create,
  update,
  remove,
  addContribution,
  updateContribution,
  removeContribution,
  addTag,
  removeTag,
};
