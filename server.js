require("dotenv").config();
const express = require("express");
const transactionsRoutes = require("./routes/transactions.routes");
const authRoutes = require("./routes/auth.routes");
const authController = require("./controllers/auth.controller");
const authMiddleware = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.use("/transactions", transactionsRoutes);
app.use("/auth", authRoutes);
app.get("/profile", authMiddleware, authController.profile);

app.use(notFound);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
