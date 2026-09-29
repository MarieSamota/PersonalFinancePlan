function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function TransactionList({
  items,
  onEdit,
  onDelete,
  filterType,
  onFilterTypeChange,
  filterCategory,
  onFilterCategoryChange,
  filterRecurring,
  onFilterRecurringChange,
}) {
  return (
    <div className="transaction-list card">
      <div className="filters">
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
        >
          <option value="all">Все типы</option>
          <option value="income">Доходы</option>
          <option value="expense">Расходы</option>
        </select>
        <select
          value={filterRecurring}
          onChange={(e) => onFilterRecurringChange(e.target.value)}
        >
          <option value="all">Все платежи</option>
          <option value="recurring">Регулярные</option>
          <option value="oneoff">Разовые</option>
        </select>
        <input
          type="text"
          placeholder="Фильтр по категории"
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value)}
        />
      </div>

      <ul>
        {items.map((t) => (
          <li key={t.id} className={t.type}>
            <span className="amount">
              {t.type === "income" ? "+" : "-"}
              {Number(t.amount).toLocaleString("ru-RU")}
            </span>
            <span className="category">
              {t.category}
              {t.isRecurring && (
                <span className="recurring-badge" title="Регулярный платёж">
                  <RepeatIcon />
                </span>
              )}
            </span>
            <span className="date">{t.date}</span>
            <span className="description">{t.description}</span>
            <div className="actions">
              <button onClick={() => onEdit(t.id)} aria-label="Изменить">
                <EditIcon />
              </button>
              <button onClick={() => onDelete(t.id)} aria-label="Удалить">
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="empty">Нет транзакций по заданному фильтру</li>
        )}
      </ul>
    </div>
  );
}
