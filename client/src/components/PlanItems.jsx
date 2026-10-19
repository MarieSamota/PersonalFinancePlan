import { useState } from "react";
import { formatAmount } from "../format";

export function PlanItems({
  items,
  members,
  user,
  ownerId,
  closed,
  onAdd,
  onToggle,
  onRemove,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);

  const emailById = Object.fromEntries(members.map((m) => [m.id, m.email]));
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const paid = items
    .filter((i) => i.paidById !== null)
    .reduce((sum, i) => sum + i.amount, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await onAdd(title, amount);
    setSaving(false);
    if (ok) {
      setTitle("");
      setAmount("");
    }
  }

  async function withPending(id, action) {
    setPendingIds((prev) => [...prev, id]);
    await action(id);
    setPendingIds((prev) => prev.filter((p) => p !== id));
  }

  return (
    <>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Всего по плану</div>
          <div className="stat-value">{formatAmount(total)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Оплачено</div>
          <div className="stat-value income">{formatAmount(paid)}</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-label">Осталось оплатить</div>
          <div className="stat-value balance">{formatAmount(total - paid)}</div>
        </div>
      </div>

      <div className="card plan-items">
        <h3>Статьи расходов</h3>
        {!closed && (
          <form className="inline-form" onSubmit={handleSubmit}>
            <input
              placeholder="Что покупаем"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="amount-input"
              type="number"
              step="0.01"
              placeholder="Сумма"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Добавление..." : "Добавить"}
            </button>
          </form>
        )}

        {items.length === 0 ? (
          <p className="empty">Статей пока нет</p>
        ) : (
          <ul>
            {items.map((item) => {
              const paidByMe = item.paidById === user.id;
              const canRemove =
                item.addedById === user.id || ownerId === user.id;
              const pending = pendingIds.includes(item.id);
              return (
                <li
                  key={item.id}
                  className={`${item.paidById !== null ? "paid" : ""} ${pending ? "pending" : ""}`}
                >
                  <span className="amount">{formatAmount(item.amount)}</span>
                  <span className="item-title">
                    {item.title}
                    <small>добавил(а) {emailById[item.addedById]}</small>
                  </span>
                  <span className="item-status">
                    {item.paidById !== null ? (
                      <>
                        оплачено
                        <small>{emailById[item.paidById] ?? "участник"}</small>
                      </>
                    ) : (
                      "не оплачено"
                    )}
                  </span>
                  <div className="actions">
                    {!closed && (item.paidById === null || paidByMe) && (
                      <button
                        disabled={pending}
                        onClick={() => withPending(item.id, onToggle)}
                      >
                        {paidByMe ? "Снять отметку" : "Я оплатил(а)"}
                      </button>
                    )}
                    {!closed && canRemove && (
                      <button
                        className="icon-button"
                        title="Удалить статью"
                        disabled={pending}
                        onClick={() => withPending(item.id, onRemove)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
