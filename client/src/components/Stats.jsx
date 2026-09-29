function TrendingUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  );
}

function TrendingDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 7 9 13 13 9 21 17" />
      <polyline points="14 17 21 17 21 10" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M16 12h3" />
    </svg>
  );
}

function formatAmount(value) {
  return `${Number(value).toLocaleString("ru-RU")} Br`;
}

export function Stats({ income, expense, balance }) {
  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-label">
          <TrendingUpIcon />
          <span>Доходы</span>
        </div>
        <div className="stat-value income">{formatAmount(income)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          <TrendingDownIcon />
          <span>Расходы</span>
        </div>
        <div className="stat-value expense">{formatAmount(expense)}</div>
      </div>
      <div className="stat-card balance">
        <div className="stat-label">
          <WalletIcon />
          <span>Баланс</span>
        </div>
        <div className="stat-value balance">{formatAmount(balance)}</div>
      </div>
    </div>
  );
}
