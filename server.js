require("dotenv").config();
const express = require("express");
const transactionsRoutes = require("./routes/transactions.routes");
const pagesRoutes = require("./routes/pages.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");
app.locals.formatDate = (date) => {
  if (!date) {
    return "–";
  }
  const [year, month, day] = String(date).split("-");
  return `${day}.${month}.${year}`;
};
app.locals.formatAmount = (amount) => {
  const [whole, fraction = ""] = String(amount).split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
};

app.use(express.static("public"));

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/transactions", transactionsRoutes);
app.use("/", pagesRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Не удалось запустить сервер: порт ${PORT} недоступен`);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:${PORT}`);
});