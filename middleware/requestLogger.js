const fs = require("fs/promises");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logsDir, "access.log");

async function writeLine(line) {
  try {
    await fs.appendFile(logFile, `${line}\n`);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(logFile, `${line}\n`);
  }
}

function requestLogger(req, res, next) {
  const line = `[${new Date().toLocaleString("ru-RU")}] ${req.method} ${req.originalUrl}`;
  console.log(line);
  writeLine(line).catch(() => {
    console.error("Не удалось записать запрос в файл журнала");
  });
  next();
}

module.exports = requestLogger;
