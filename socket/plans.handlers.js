const crypto = require("crypto");
const db = require("../models/index");
const { planRoom, userRoom, socketsCount } = require("./rooms");

const { SharedPlan, PlanMember, PlanItem, PlanMessage, sequelize } = db;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const HISTORY_LIMIT = 50;
const MAX_INT = 2147483647;

class PlanError extends Error {}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && id <= MAX_INT ? id : null;
}

function generateInviteCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function planDto(plan) {
  return {
    id: plan.id,
    title: plan.title,
    inviteCode: plan.inviteCode,
    ownerId: plan.ownerId,
    closedAt: plan.closedAt,
  };
}

function messageDto(message, email) {
  return {
    id: message.id,
    planId: message.planId,
    type: message.type,
    text: message.text,
    createdAt: message.createdAt,
    userId: message.userId,
    email,
  };
}

function errorMessage(err) {
  if (err instanceof PlanError) {
    return err.message;
  }
  if (err.name === "SequelizeValidationError") {
    return err.errors
      .filter((e) => e.type !== "string violation")
      .map((e) => e.message)
      .join("; ");
  }
  console.error(err);
  return "Ошибка сервера";
}

async function requireMember(planId, userId) {
  const id = parseId(planId);
  const membership =
    id &&
    (await PlanMember.findOne({
      where: { planId: id, userId },
      include: "plan",
    }));
  if (!membership) {
    throw new PlanError("Нет доступа к купийке");
  }
  return membership.plan;
}

function requireOpen(plan) {
  if (plan.closedAt) {
    throw new PlanError("Купийка закрыта");
  }
}

async function inOpenPlan(planId, userId, action) {
  const plan = await requireMember(planId, userId);
  return sequelize.transaction(async (transaction) => {
    const locked = await SharedPlan.findByPk(plan.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    requireOpen(locked);
    return action(locked, transaction);
  });
}

async function findItem(planId, itemId, transaction) {
  const id = parseId(itemId);
  const item =
    id && (await PlanItem.findOne({ where: { id, planId }, transaction }));
  if (!item) {
    throw new PlanError("Статья не найдена");
  }
  return item;
}

function loadItems(planId) {
  return PlanItem.findAll({ where: { planId }, order: [["id", "ASC"]] });
}

async function createPlan(title, ownerId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const plan = await SharedPlan.create(
          { title, ownerId, inviteCode: generateInviteCode() },
          { transaction },
        );
        await PlanMember.create(
          { planId: plan.id, userId: ownerId },
          { transaction },
        );
        return plan;
      });
    } catch (err) {
      if (err.name !== "SequelizeUniqueConstraintError") {
        throw err;
      }
    }
  }
  throw new PlanError("Не удалось создать код приглашения, попробуйте ещё раз");
}

function registerPlanHandlers(io, socket) {
  const user = socket.data.user;

  function on(event, handler) {
    socket.on(event, async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const result = await handler(payload ?? {});
        reply({ ok: true, ...result });
      } catch (err) {
        reply({ error: errorMessage(err) });
      }
    });
  }

  async function addEvent(planId, text) {
    const message = await PlanMessage.create({
      planId,
      userId: user.id,
      type: "event",
      text,
    });
    io.to(planRoom(planId)).emit(
      "chat message",
      messageDto(message, user.email),
    );
  }

  async function broadcastItems(planId) {
    const items = await loadItems(planId);
    io.to(planRoom(planId)).emit("plan:updated", { planId, items });
  }

  on("plans:list", async () => {
    const memberships = await PlanMember.findAll({
      where: { userId: user.id },
      include: "plan",
      order: [["createdAt", "ASC"]],
    });
    return { plans: memberships.map((m) => planDto(m.plan)) };
  });

  on("plan:create", async ({ title }) => {
    const plan = await createPlan(title, user.id);
    io.in(userRoom(user.id)).socketsJoin(planRoom(plan.id));
    await addEvent(plan.id, `Купийка «${plan.title}» создана (${user.email})`);
    return { plan: planDto(plan) };
  });

  on("plan:join", async ({ code }) => {
    const inviteCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";
    const plan =
      inviteCode && (await SharedPlan.findOne({ where: { inviteCode } }));
    if (!plan) {
      throw new PlanError("Купийка с таким кодом не найдена");
    }

    const existing = await PlanMember.findOne({
      where: { planId: plan.id, userId: user.id },
    });
    if (existing) {
      throw new PlanError("Вы уже участник этой купийки");
    }

    await PlanMember.create({ planId: plan.id, userId: user.id });
    io.in(userRoom(user.id)).socketsJoin(planRoom(plan.id));
    io.to(planRoom(plan.id))
      .except(userRoom(user.id))
      .emit("member joined", {
        planId: plan.id,
        member: { id: user.id, email: user.email, online: true },
      });
    await addEvent(plan.id, `Новый участник: ${user.email}`);
    return { plan: planDto(plan) };
  });

  on("plan:open", async ({ planId }) => {
    const plan = await requireMember(planId, user.id);

    const [members, items, history] = await Promise.all([
      PlanMember.findAll({
        where: { planId: plan.id },
        include: { association: "user", attributes: ["id", "email"] },
        order: [["createdAt", "ASC"]],
      }),
      loadItems(plan.id),
      PlanMessage.findAll({
        where: { planId: plan.id },
        include: { association: "user", attributes: ["email"] },
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        limit: HISTORY_LIMIT,
      }),
    ]);

    return {
      plan: planDto(plan),
      members: members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        online: socketsCount(io, userRoom(m.user.id)) > 0,
      })),
      items,
      messages: history.reverse().map((m) => messageDto(m, m.user.email)),
    };
  });

  on("item:add", async ({ planId, title, amount }) => {
    const item = await inOpenPlan(planId, user.id, (plan, transaction) =>
      PlanItem.create(
        { planId: plan.id, title, amount, addedById: user.id },
        { transaction },
      ),
    );
    await broadcastItems(item.planId);
    await addEvent(
      item.planId,
      `Добавлена статья «${item.title}» – ${item.amount.toLocaleString("ru-RU")} Br (${user.email})`,
    );
    return { item };
  });

  on("item:pay", async ({ planId, itemId }) => {
    const item = await inOpenPlan(
      planId,
      user.id,
      async (plan, transaction) => {
        const found = await findItem(plan.id, itemId, transaction);
        if (found.paidById !== null && found.paidById !== user.id) {
          throw new PlanError("Статью уже оплатил другой участник");
        }
        return found.update(
          { paidById: found.paidById === null ? user.id : null },
          { transaction },
        );
      },
    );

    await broadcastItems(item.planId);
    await addEvent(
      item.planId,
      item.paidById === null
        ? `Снята отметка об оплате «${item.title}» (${user.email})`
        : `Оплачена статья «${item.title}» (${user.email})`,
    );
    return {};
  });

  on("item:remove", async ({ planId, itemId }) => {
    const item = await inOpenPlan(
      planId,
      user.id,
      async (plan, transaction) => {
        const found = await findItem(plan.id, itemId, transaction);
        if (found.addedById !== user.id && plan.ownerId !== user.id) {
          throw new PlanError(
            "Удалить статью может только тот, кто её добавил, или создатель купийки",
          );
        }
        await found.destroy({ transaction });
        return found;
      },
    );

    await broadcastItems(item.planId);
    await addEvent(
      item.planId,
      `Удалена статья «${item.title}» (${user.email})`,
    );
    return {};
  });

  on("plan:close", async ({ planId }) => {
    const plan = await inOpenPlan(
      planId,
      user.id,
      async (found, transaction) => {
        if (found.ownerId !== user.id) {
          throw new PlanError("Закрыть купийку может только её создатель");
        }
        const items = await PlanItem.findAll({
          where: { planId: found.id },
          attributes: ["paidById"],
          transaction,
        });
        if (items.length === 0) {
          throw new PlanError("В купийке нет ни одной статьи");
        }
        if (items.some((i) => i.paidById === null)) {
          throw new PlanError(
            "Закрыть купийку можно, когда все статьи оплачены",
          );
        }
        return found.update({ closedAt: new Date() }, { transaction });
      },
    );

    io.to(planRoom(plan.id)).emit("plan:closed", {
      planId: plan.id,
      title: plan.title,
      closedAt: plan.closedAt,
    });
    await addEvent(plan.id, `Купийка закрыта – всё оплачено (${user.email})`);
    return { plan: planDto(plan) };
  });

  on("chat message", async ({ planId, text }) => {
    const plan = await requireMember(planId, user.id);
    requireOpen(plan);
    const message = await PlanMessage.create({
      planId: plan.id,
      userId: user.id,
      type: "message",
      text,
    });
    io.to(planRoom(plan.id)).emit(
      "chat message",
      messageDto(message, user.email),
    );
    return {};
  });

  socket.on("typing", (payload) => {
    const planId = parseId(payload?.planId);
    const room = planRoom(planId);
    if (planId && socket.rooms.has(room)) {
      socket.to(room).emit("user typing", { planId, email: user.email });
    }
  });

  on("remind", async ({ planId, userId }) => {
    const plan = await requireMember(planId, user.id);
    requireOpen(plan);
    const targetId = parseId(userId);
    if (!targetId || targetId === user.id) {
      throw new PlanError("Выберите другого участника");
    }

    const target = await PlanMember.findOne({
      where: { planId: plan.id, userId: targetId },
    });
    if (!target) {
      throw new PlanError("Участник не найден");
    }
    if (socketsCount(io, userRoom(targetId)) === 0) {
      throw new PlanError("Участник сейчас не в сети");
    }

    io.to(userRoom(targetId)).emit("reminder", {
      planId: plan.id,
      planTitle: plan.title,
      from: user.email,
    });
    return {};
  });
}

module.exports = registerPlanHandlers;
