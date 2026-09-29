import { useState } from "react";

export function TransactionForm({ initialValues, onSubmit, onCancel }) {
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [type, setType] = useState(initialValues?.type ?? "expense");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [isRecurring, setIsRecurring] = useState(
    initialValues?.isRecurring ?? false,
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !category) return;

    onSubmit({
      amount: Number(amount),
      type,
      category,
      date,
      description,
      isRecurring,
    });

    if (!initialValues) {
      setAmount("");
      setCategory("");
      setDescription("");
      setIsRecurring(false);
    }
  }

  return (
    <form className="transaction-form card" onSubmit={handleSubmit}>
      <div className="form-fields">
        <input
          type="number"
          placeholder="Сумма"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
        <input
          type="text"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-fields-full"
        />
        <label className="checkbox-field form-fields-full">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          Регулярный платёж
        </label>
      </div>
      <div className="form-actions">
        {initialValues && (
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit">
          {initialValues ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </form>
  );
}
