require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const transactionsRoutes = require("./routes/transactions.routes");
const goalsRoutes = require("./routes/goals.routes");
const authRoutes = require("./routes/auth.routes");
const authController = require("./controllers/auth.controller");
const authMiddleware = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/transactions", authMiddleware, transactionsRoutes);
app.use("/goals", authMiddleware, goalsRoutes);
app.use("/auth", authRoutes);
app.get("/profile", authMiddleware, authController.profile);

app.use(notFound);
app.use(errorHandler);

initSocket(io);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
