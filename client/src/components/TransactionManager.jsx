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

function notifyError(message, err) {
  if (err.response?.status === 401) return;
  alert(`${message}: ${getErrorMessage(err)}`);
}

export function TransactionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
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
    setSaving(true);
    try {
      const response = await addItem(data);
      setItems((prev) => [...prev, response.data]);
      return true;
    } catch (err) {
      notifyError("Не удалось добавить транзакцию", err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id, data) {
    setSaving(true);
    try {
      const response = await updateItem(id, data);
      setItems((prev) => prev.map((t) => (t.id === id ? response.data : t)));
      setEditingId(null);
      return true;
    } catch (err) {
      notifyError("Не удалось сохранить изменения", err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function removeFromList(id) {
    setItems((prev) => prev.filter((t) => t.id !== id));
    setEditingId((current) => (current === id ? null : current));
  }

  async function handleDelete(id) {
    setDeletingIds((prev) => [...prev, id]);
    try {
      await deleteItem(id);
      removeFromList(id);
    } catch (err) {
      if (err.response?.status === 404) {
        removeFromList(id);
      } else {
        notifyError("Не удалось удалить транзакцию", err);
      }
    } finally {
      setDeletingIds((prev) => prev.filter((d) => d !== id));
    }
  }

  function handleSubmit(data) {
    return editingItem ? handleUpdate(editingId, data) : handleAdd(data);
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
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => setEditingId(null)}
      />
      <TransactionList
        items={filteredItems}
        loading={loading}
        error={error}
        onRetry={() => loadItems()}
        deletingIds={deletingIds}
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
