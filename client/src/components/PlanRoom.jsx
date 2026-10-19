import { useCallback, useEffect, useRef, useState } from "react";
import { socket, request } from "../socket";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { PlanItems } from "./PlanItems";
import { PlanSplit } from "./PlanSplit";
import { PlanFeed } from "./PlanFeed";
import { formatDate } from "../format";

export function PlanRoom({ planId, user, onBack }) {
  const [plan, setPlan] = useState(null);
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingEmail, setTypingEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [closing, setClosing] = useState(false);
  const typingTimer = useRef(null);

  const loadPlan = useCallback(() => {
    request("plan:open", { planId })
      .then((data) => {
        setPlan(data.plan);
        setMembers(data.members);
        setItems(data.items);
        setMessages(data.messages);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  function handleRetry() {
    setLoading(true);
    setError(null);
    loadPlan();
  }

  useEffect(() => {
    function handleItems(data) {
      if (data.planId === planId) {
        setItems(data.items);
      }
    }

    function handleMessage(message) {
      if (message.planId !== planId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      if (message.type === "message") {
        setTypingEmail((current) =>
          current === message.email ? null : current,
        );
      }
    }

    function handleMemberJoined(data) {
      if (data.planId !== planId) return;
      setMembers((prev) =>
        prev.some((m) => m.id === data.member.id)
          ? prev
          : [...prev, data.member],
      );
    }

    function setOnline(userId, online) {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, online } : m)),
      );
    }

    function handleOnline({ userId }) {
      setOnline(userId, true);
    }

    function handleOffline({ userId }) {
      setOnline(userId, false);
    }

    function handleClosed(data) {
      if (data.planId !== planId) return;
      setPlan((prev) => (prev ? { ...prev, closedAt: data.closedAt } : prev));
      setTypingEmail(null);
    }

    function handleTyping(data) {
      if (data.planId !== planId) return;
      setTypingEmail(data.email);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingEmail(null), 2000);
    }

    socket.on("connect", loadPlan);
    socket.on("plan:updated", handleItems);
    socket.on("chat message", handleMessage);
    socket.on("member joined", handleMemberJoined);
    socket.on("user online", handleOnline);
    socket.on("user offline", handleOffline);
    socket.on("user typing", handleTyping);
    socket.on("plan:closed", handleClosed);

    return () => {
      socket.off("connect", loadPlan);
      socket.off("plan:updated", handleItems);
      socket.off("chat message", handleMessage);
      socket.off("member joined", handleMemberJoined);
      socket.off("user online", handleOnline);
      socket.off("user offline", handleOffline);
      socket.off("user typing", handleTyping);
      socket.off("plan:closed", handleClosed);
      clearTimeout(typingTimer.current);
    };
  }, [planId, loadPlan]);

  async function run(event, payload) {
    setActionError(null);
    try {
      await request(event, { planId, ...payload });
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  }

  async function handleClose() {
    if (
      !window.confirm(
        "Закрыть купийку? После закрытия её нельзя будет изменить.",
      )
    ) {
      return;
    }
    setClosing(true);
    await run("plan:close");
    setClosing(false);
  }

  if (!plan) {
    return (
      <div className="plans plan-room">
        <button className="back-button" onClick={onBack}>
          ← Все купийки
        </button>
        {loading ? (
          <Spinner />
        ) : (
          <ErrorMessage error={error} onRetry={handleRetry} />
        )}
      </div>
    );
  }

  const closed = Boolean(plan.closedAt);
  const isOwner = plan.ownerId === user.id;
  const allPaid = items.length > 0 && items.every((i) => i.paidById !== null);

  return (
    <div className="plans plan-room">
      <div className="plan-header">
        <button className="back-button" onClick={onBack}>
          ← Все купийки
        </button>
        <div className="plan-title">
          <h2>{plan.title}</h2>
          <p className="plan-code">
            Код приглашения: <code>{plan.inviteCode}</code>
          </p>
        </div>
        {closed ? (
          <span className="closed-badge">
            Закрыта {formatDate(plan.closedAt)}
          </span>
        ) : (
          isOwner && (
            <button
              className="close-button"
              disabled={!allPaid || closing}
              title={
                allPaid
                  ? "Сбор завершён – закрыть купийку"
                  : "Закрыть можно, когда все статьи оплачены"
              }
              onClick={handleClose}
            >
              {closing ? "Закрытие..." : "Закрыть купийку"}
            </button>
          )
        )}
      </div>

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      <PlanItems
        items={items}
        members={members}
        user={user}
        ownerId={plan.ownerId}
        closed={closed}
        onAdd={(title, amount) => run("item:add", { title, amount })}
        onToggle={(itemId) => run("item:pay", { itemId })}
        onRemove={(itemId) => run("item:remove", { itemId })}
      />
      <PlanSplit
        items={items}
        members={members}
        user={user}
        closed={closed}
        onRemind={(userId) => run("remind", { userId })}
      />
      <PlanFeed
        planId={planId}
        messages={messages}
        typingEmail={typingEmail}
        closed={closed}
        onSend={(text) => run("chat message", { text })}
      />
    </div>
  );
}
