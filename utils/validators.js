const MAX_INT = 2147483647;
const MIN_DATE = "1900-01-01";
const MAX_DATE = "2099-12-31";

function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= MIN_DATE &&
    value <= MAX_DATE
  );
}

function toNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && id <= MAX_INT ? id : null;
}

module.exports = { isDateOnly, toNumber, parseId };
