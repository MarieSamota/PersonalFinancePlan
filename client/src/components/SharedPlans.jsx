import { useCallback, useEffect, useState } from "react";
import { socket, request } from "../socket";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { PlanRoom } from "./PlanRoom";

export function SharedPlans({ user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadPlans = useCallback(() => {
    request("plans:list")
      .then((response) => {
        setPlans(response.plans);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClosed({ planId, closedAt }) {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, closedAt } : p)),
      );
    }

    loadPlans();
    socket.on("connect", loadPlans);
    socket.on("plan:closed", handleClosed);
    return () => {
      socket.off("connect", loadPlans);
      socket.off("plan:closed", handleClosed);
    };
  }, [loadPlans]);

  const sortedPlans = [...plans].sort(
    (a, b) => Boolean(a.closedAt) - Boolean(b.closedAt),
  );

  function handleRetry() {
    setLoading(true);
    setError(null);
    loadPlans();
  }

  async function submit(event, payload, onSuccess) {
    setBusy(true);
    setFormError(null);
    try {
      const response = await request(event, payload);
      setPlans((prev) => [...prev, response.plan]);
      onSuccess();
      setOpenId(response.plan.id);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCreate(e) {
    e.preventDefault();
    submit("plan:create", { title }, () => setTitle(""));
  }

  function handleJoin(e) {
    e.preventDefault();
    submit("plan:join", { code }, () => setCode(""));
  }

  if (openId) {
    return (
      <PlanRoom planId={openId} user={user} onBack={() => setOpenId(null)} />
    );
  }

  return (
    <div className="plans">
      <div className="card plans-actions">
        <h2>Купийка</h2>
        <p className="plans-subtitle">
          Общий план расходов для семьи, друзей или коллег: статьи, кто что
          оплатил и кто сколько должен – у всех участников в реальном времени.
        </p>
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            placeholder="Например, Отпуск в Грузии"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="primary" disabled={busy}>
            Создать купийку
          </button>
        </form>
        <form className="inline-form" onSubmit={handleJoin}>
          <input
            placeholder="Код приглашения"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            Вступить по коду
          </button>
        </form>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </div>

      <div className="card plans-list">
        <h3>Мои купийки</h3>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage error={error} onRetry={handleRetry} />
        ) : plans.length === 0 ? (
          <p className="empty">
            Пока нет ни одной купийки – создайте свою или вступите по коду.
          </p>
        ) : (
          <ul>
            {sortedPlans.map((p) => (
              <li key={p.id}>
                <button
                  className={`plan-link ${p.closedAt ? "closed" : ""}`}
                  onClick={() => setOpenId(p.id)}
                >
                  <span>{p.title}</span>
                  {p.closedAt ? (
                    <span className="closed-badge">закрыта</span>
                  ) : (
                    <span className="invite-code">{p.inviteCode}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
