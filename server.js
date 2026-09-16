require("dotenv").config();
const express = require("express");
const transactionsRoutes = require("./routes/transactions.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.use("/transactions", transactionsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
