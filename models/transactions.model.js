// { id, amount, type, category, date, description }

let transactions = [
  {
    id: 1,
    amount: 250,
    type: "income",
    category: "Поступления",
    date: "2026-09-01",
    description: "Стипендия",
  },
  {
    id: 2,
    amount: 20,
    type: "expense",
    category: "Продукты",
    date: "2026-09-02",
    description: "Алми",
  },
  {
    id: 3,
    amount: 51,
    type: "expense",
    category: "Транспорт",
    date: "2026-09-02",
    description: "Проездной билет",
  },
];

let nextId = 4;

function getAll() {
  return transactions;
}

function getById(id) {
  return transactions.find((t) => t.id === id);
}

function create(data) {
  const transaction = {
    id: nextId++,
    amount: data.amount,
    type: data.type,
    category: data.category,
    date: data.date,
    description: data.description,
  };
  transactions.push(transaction);
  return transaction;
}

function update(id, data) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return undefined;
  }
  transaction.amount = data.amount;
  transaction.type = data.type;
  transaction.category = data.category;
  transaction.date = data.date;
  transaction.description = data.description;
  return transaction;
}

function remove(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return false;
  }
  transactions.splice(index, 1);
  return true;
}

export { getAll, getById, create, update, remove };
