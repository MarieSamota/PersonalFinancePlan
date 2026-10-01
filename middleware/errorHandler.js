function isApiRequest(req) {
  return req.originalUrl.startsWith("/transactions");
}

function notFound(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: "Маршрут не найден" });
  }
  res.status(404).render("404", { title: "Страница не найдена" });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (!isApiRequest(req)) {
    return res.status(500).render("500", { title: "Ошибка сервера" });
  }

  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
  }

  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const message = err.errors.map((e) => e.message).join("; ");
    return res.status(400).json({ error: message });
  }

  res
    .status(err.status || 500)
    .json({ error: err.message || "Внутренняя ошибка сервера" });
}

module.exports = { notFound, errorHandler };