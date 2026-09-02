const express = require("express");
const app = express();

app.use(express.json());

const transactionsRoutes = require("./routes/transactions.routes");
app.use("/transactions", transactionsRoutes);

const { notFound, errorHandler } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
