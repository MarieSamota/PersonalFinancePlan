require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const transactionsRoutes = require("./routes/transactions.routes");
const goalsRoutes = require("./routes/goals.routes");
const budgetsRoutes = require("./routes/budgets.routes");
const authRoutes = require("./routes/auth.routes");
const authController = require("./controllers/auth.controller");
const authMiddleware = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PersonalFinancePlan API",
      version: "1.0.0",
      description: "REST API системы персонального финансового плана",
    },
    servers: [{ url: "http://localhost:3000" }],
    security: [{ bearerAuth: [] }],
  },
  apis: ["./docs/openapi.yaml"],
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/transactions", authMiddleware, transactionsRoutes);
app.use("/goals", authMiddleware, goalsRoutes);
app.use("/budgets", authMiddleware, budgetsRoutes);
app.use("/auth", authRoutes);
app.get("/profile", authMiddleware, authController.profile);

app.use(notFound);
app.use(errorHandler);

initSocket(io);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
