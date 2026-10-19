export function formatAmount(value) {
  return `${Number(value).toLocaleString("ru-RU")} Br`;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("ru-RU");
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
