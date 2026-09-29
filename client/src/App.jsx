import { useEffect, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { Stats } from "./components/Stats";
import "./App.css";

const initialTransactions = [
  {
    id: 1,
    amount: 2100,
    type: "income",
    category: "Зарплата",
    date: "2026-09-01",
    description: "Зарплата за август",
    isRecurring: true,
  },
  {
    id: 2,
    amount: 35,
    type: "expense",
    category: "Продукты",
    date: "2026-09-03",
    description: "Покупки в магазине",
    isRecurring: false,
  },
];

function App() {
  const [items, setItems] = useLocalStorage(
    "transactions",
    initialTransactions,
  );
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRecurring, setFilterRecurring] = useState("all");
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    const income = items
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = items
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    setStats({ income, expense, balance: income - expense });
  }, [items]);

  const filteredItems = items.filter(
    (t) =>
      (filterType === "all" || t.type === filterType) &&
      (filterCategory.trim() === "" ||
        t.category
          .toLowerCase()
          .includes(filterCategory.trim().toLowerCase())) &&
      (filterRecurring === "all" ||
        (filterRecurring === "recurring" && t.isRecurring) ||
        (filterRecurring === "oneoff" && !t.isRecurring)),
  );

  const editingItem = items.find((t) => t.id === editingId) ?? null;

  function handleSubmit(data) {
    if (editingItem) {
      setItems((prev) =>
        prev.map((t) => (t.id === editingId ? { ...data, id: editingId } : t)),
      );
      setEditingId(null);
    } else {
      setItems((prev) => [...prev, { ...data, id: Date.now() }]);
    }
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((t) => t.id !== id));
    if (id === editingId) setEditingId(null);
  }

  return (
    <div className="app">
      <h1>Финансы</h1>
      <Stats
        income={stats.income}
        expense={stats.expense}
        balance={stats.balance}
      />
      <TransactionForm
        key={editingId ?? "new"}
        initialValues={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => setEditingId(null)}
      />
      <TransactionList
        items={filteredItems}
        onEdit={setEditingId}
        onDelete={handleDelete}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterRecurring={filterRecurring}
        onFilterRecurringChange={setFilterRecurring}
      />
    </div>
  );
}

export default App;
