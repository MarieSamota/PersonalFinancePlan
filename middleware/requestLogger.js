const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");
fs.mkdirSync(logsDir, { recursive: true });

const logStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

function requestLogger(req, res, next) {
  const line = `[${new Date().toLocaleString("ru-RU")}] ${req.method} ${req.originalUrl}`;
  console.log(line);
  logStream.write(`${line}\n`);
  next();
}

module.exports = requestLogger;
