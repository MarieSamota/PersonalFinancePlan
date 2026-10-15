const Goal = require("../models/mongo/Goal");

const GOAL_FIELDS = ["title", "targetAmount", "deadline", "tags"];
const CONTRIBUTION_FIELDS = ["amount", "date", "note"];
const UPDATE_OPTIONS = { returnDocument: "after", runValidators: true };

function pick(body, fields) {
  const data = {};
  for (const field of fields) {
    if (body?.[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
}

function normalizeTag(tag) {
  return String(tag).trim().toLowerCase();
}

function goalData(body) {
  const data = pick(body, GOAL_FIELDS);
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      return { error: "Поле tags должно быть массивом строк" };
    }
    data.tags = [...new Set(data.tags.map(normalizeTag).filter(Boolean))];
  }
  return { data };
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ownGoal(req) {
  return { _id: req.params.id, userId: req.user.id };
}

function goalNotFound(res) {
  return res.status(404).json({ error: "Цель не найдена" });
}

async function getAll(req, res) {
  const { tag, search, status } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
  );

  const filter = { userId: req.user.id };
  if (typeof tag === "string" && tag.trim() !== "") {
    filter.tags = normalizeTag(tag);
  }
  if (typeof search === "string" && search.trim() !== "") {
    filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
  }
  if (status === "reached" || status === "active") {
    const operator = status === "reached" ? "$gte" : "$lt";
    filter.$expr = {
      [operator]: [{ $sum: "$contributions.amount" }, "$targetAmount"],
    };
  }

  const [goals, total] = await Promise.all([
    Goal.find(filter)
      .sort({ deadline: 1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Goal.countDocuments(filter),
  ]);

  res.status(200).json({ goals, total, page, limit });
}

async function stats(req, res) {
  const months = await Goal.aggregate([
    { $match: { userId: req.user.id } },
    { $unwind: "$contributions" },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$contributions.date" },
        },
        total: { $sum: "$contributions.amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: "$_id", total: 1, count: 1 } },
  ]);

  res.status(200).json(months);
}

async function getOne(req, res) {
  const goal = await Goal.findOwn(req.params.id, req.user.id);
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(200).json(goal);
}

async function create(req, res) {
  const { data, error } = goalData(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const goal = await Goal.create({ ...data, userId: req.user.id });
  res.status(201).json(goal);
}

async function update(req, res) {
  const { data, error } = goalData(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const goal = await Goal.findOneAndUpdate(ownGoal(req), data, UPDATE_OPTIONS);
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(200).json(goal);
}

async function remove(req, res) {
  const goal = await Goal.findOneAndDelete(ownGoal(req));
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(200).json(goal);
}

async function addContribution(req, res) {
  const contribution = pick(req.body, CONTRIBUTION_FIELDS);

  const goal = await Goal.findOneAndUpdate(
    ownGoal(req),
    { $push: { contributions: contribution } },
    UPDATE_OPTIONS,
  );
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(201).json(goal);
}

async function updateContribution(req, res) {
  const changes = pick(req.body, CONTRIBUTION_FIELDS);
  if (Object.keys(changes).length === 0) {
    return res
      .status(400)
      .json({ error: "Передайте хотя бы одно поле: amount, date или note" });
  }

  const set = {};
  for (const [field, value] of Object.entries(changes)) {
    set[`contributions.$.${field}`] = value;
  }

  const goal = await Goal.findOneAndUpdate(
    { ...ownGoal(req), "contributions._id": req.params.contributionId },
    { $set: set },
    UPDATE_OPTIONS,
  );
  if (!goal) {
    return res.status(404).json({ error: "Цель или взнос не найдены" });
  }

  res.status(200).json(goal);
}

async function removeContribution(req, res) {
  const goal = await Goal.findOneAndUpdate(
    { ...ownGoal(req), "contributions._id": req.params.contributionId },
    { $pull: { contributions: { _id: req.params.contributionId } } },
    UPDATE_OPTIONS,
  );
  if (!goal) {
    return res.status(404).json({ error: "Цель или взнос не найдены" });
  }

  res.status(200).json(goal);
}

async function addTag(req, res) {
  const tag = typeof req.body?.tag === "string" ? normalizeTag(req.body.tag) : "";
  if (tag === "") {
    return res.status(400).json({ error: "Поле tag должно быть непустой строкой" });
  }

  const goal = await Goal.findOneAndUpdate(
    ownGoal(req),
    { $addToSet: { tags: tag } },
    UPDATE_OPTIONS,
  );
  if (!goal) {
    return goalNotFound(res);
  }

  res.status(200).json(goal);
}

async function removeTag(req, res) {
  const tag = normalizeTag(req.params.tag);

  const goal = await Goal.findOneAndUpdate(
    { ...ownGoal(req), tags: tag },
    { $pull: { tags: tag } },
    UPDATE_OPTIONS,
  );
  if (!goal) {
    return res.status(404).json({ error: "Цель или тег не найдены" });
  }

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
