import { useState } from "react";
import { formatAmount } from "../format";

export function PlanSplit({ items, members, user, closed, onRemind }) {
  const [sentIds, setSentIds] = useState([]);

  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const share = members.length > 0 ? total / members.length : 0;
  const rows = members.map((m) => {
    const paid = items
      .filter((i) => i.paidById === m.id)
      .reduce((sum, i) => sum + i.amount, 0);
    return { ...m, paid, balance: Math.round((paid - share) * 100) / 100 };
  });

  async function handleRemind(memberId) {
    if (await onRemind(memberId)) {
      setSentIds((prev) => [...prev, memberId]);
      setTimeout(() => {
        setSentIds((prev) => prev.filter((id) => id !== memberId));
      }, 3000);
    }
  }

  function balanceText(balance) {
    if (balance > 0) return `переплата ${formatAmount(balance)}`;
    if (balance < 0) return `к доплате ${formatAmount(-balance)}`;
    return "в расчёте";
  }

  return (
    <div className="card plan-split">
      <h3>Участники и расчёт</h3>
      <p className="split-share">
        Доля каждого: {formatAmount(Math.round(share * 100) / 100)} (
        {formatAmount(total)} на {members.length})
      </p>
      <ul>
        {rows.map((m) => (
          <li key={m.id}>
            <span
              className={`status-dot ${m.online ? "online" : ""}`}
              title={m.online ? "В сети" : "Не в сети"}
            />
            <span className="member-email">
              {m.email}
              {m.id === user.id && " (вы)"}
            </span>
            <span className="member-paid">оплачено {formatAmount(m.paid)}</span>
            <span
              className={`member-balance ${m.balance > 0 ? "plus" : m.balance < 0 ? "minus" : ""}`}
            >
              {balanceText(m.balance)}
            </span>
            <span className="member-action">
              {!closed && m.balance < 0 && m.id !== user.id && (
                <button
                  disabled={!m.online || sentIds.includes(m.id)}
                  title={
                    m.online ? "Отправить напоминание" : "Участник не в сети"
                  }
                  onClick={() => handleRemind(m.id)}
                >
                  {sentIds.includes(m.id) ? "Отправлено" : "Напомнить"}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
