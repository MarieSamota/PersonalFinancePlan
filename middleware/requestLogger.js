const { existsSync } = require("fs");
const fs = require("fs/promises");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logsDir, "access.log");

let logExisted = existsSync(logFile);
let deletedNotice = "";

async function describeLogProblem() {
  const dir = await fs.stat(logsDir).catch(() => null);
  const file = await fs.stat(logFile).catch(() => null);
  if ((dir && !dir.isDirectory()) || file) {
    return "Проблема с папкой или файлом журнала логов";
  }
  return "";
}

async function checkDeleted() {
  if (!logExisted || (await describeLogProblem())) {
    return;
  }
  logExisted = false;
  const dir = await fs.stat(logsDir).catch(() => null);
  deletedNotice = dir
    ? "Файл журнала логов был удалён, записи начаты заново"
    : "Папка журнала логов была удалена, записи начаты заново";
  console.error(deletedNotice);
}

function takeDeletedNotice() {
  const notice = deletedNotice;
  deletedNotice = "";
  return notice;
}

async function writeLine(line) {
  await checkDeleted();
  try {
    await fs.appendFile(logFile, `${line}\n`);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(logFile, `${line}\n`);
  }
  logExisted = true;
}

async function requestLogger(req, res, next) {
  const line = `[${new Date().toLocaleString("ru-RU")}] ${req.method} ${req.originalUrl}`;
  console.log(line);
  try {
    await writeLine(line);
  } catch {
    const reason = await describeLogProblem();
    console.error(`Не удалось записать в журнал. ${reason}`);
  }
  next();
}

module.exports = requestLogger;
module.exports.logFile = logFile;
module.exports.describeLogProblem = describeLogProblem;
module.exports.takeDeletedNotice = takeDeletedNotice;
