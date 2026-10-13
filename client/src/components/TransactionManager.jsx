import { useCallback, useEffect, useState } from "react";
import {
  fetchItems,
  addItem,
  updateItem,
  deleteItem,
  getErrorMessage,
} from "../api";
import { useDebounce } from "../hooks/useDebounce";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { Stats } from "./Stats";

// при 401 пользователь уже переброшен на форму входа, окно с ошибкой поверх неё лишнее
function notifyError(message, err) {
  if (err.response?.status === 401) return;
  alert(`${message}: ${getErrorMessage(err)}`);
}

export function TransactionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterRecurring, setFilterRecurring] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  const loadItems = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchItems(debouncedSearch, signal);
        setItems(response.data);
        setEditingId(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

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
      (filterRecurring === "all" ||
        (filterRecurring === "recurring" && t.isRecurring) ||
        (filterRecurring === "oneoff" && !t.isRecurring)),
  );

  const editingItem = items.find((t) => t.id === editingId) ?? null;

  async function handleAdd(data) {
    const tempId = Date.now();
    setItems((prev) => [...prev, { ...data, id: tempId, isPending: true }]);

    try {
      const response = await addItem(data);
      setItems((prev) =>
        prev.map((t) => (t.id === tempId ? response.data : t)),
      );
    } catch (err) {
      setItems((prev) => prev.filter((t) => t.id !== tempId));
      notifyError("Не удалось добавить транзакцию", err);
    }
  }

  async function handleUpdate(id, data) {
    const original = items.find((t) => t.id === id);
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, isPending: true } : t)),
    );
    setEditingId(null);

    try {
      const response = await updateItem(id, data);
      setItems((prev) => prev.map((t) => (t.id === id ? response.data : t)));
    } catch (err) {
      setItems((prev) => prev.map((t) => (t.id === id ? original : t)));
      notifyError("Не удалось сохранить изменения", err);
    }
  }

  async function handleDelete(id) {
    const deleted = items.find((t) => t.id === id);
    setItems((prev) => prev.filter((t) => t.id !== id));
    if (id === editingId) setEditingId(null);

    try {
      await deleteItem(id);
    } catch (err) {
      // 404 – записи на сервере уже нет, возвращать её в список не нужно
      if (err.response?.status === 404) return;
      // сортировка по id возвращает элемент на прежнее место (сервер отдаёт список по id)
      setItems((prev) => [...prev, deleted].sort((a, b) => a.id - b.id));
      notifyError("Не удалось удалить транзакцию", err);
    }
  }

  function handleSubmit(data) {
    if (editingItem) {
      handleUpdate(editingId, data);
    } else {
      handleAdd(data);
    }
  }

  return (
    <>
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
        loading={loading}
        error={error}
        onRetry={() => loadItems()}
        onEdit={setEditingId}
        onDelete={handleDelete}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterRecurring={filterRecurring}
        onFilterRecurringChange={setFilterRecurring}
        search={search}
        onSearchChange={setSearch}
      />
    </>
  );
}
