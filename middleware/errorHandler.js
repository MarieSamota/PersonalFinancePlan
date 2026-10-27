function isApiRequest(req) {
  return /^\/transactions(?:[/?]|$)/.test(req.originalUrl);
}

function notFound(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: "Маршрут не найден" });
  }
  res.status(404).render("404", { title: "Страница не найдена" });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status >= 400 && err.status < 500 ? err.status : 500;

  if (!isApiRequest(req)) {
    if (status === 500) {
      return res.status(500).render("500", { title: "Ошибка сервера" });
    }
    return res.status(status).render("404", { title: "Страница не найдена" });
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

  res.status(status).json({
    error: status === 500 ? "Внутренняя ошибка сервера" : err.message,
  });
}

module.exports = { notFound, errorHandler };
