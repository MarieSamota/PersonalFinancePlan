function notFound(req, res) {
  res.status(404).json({ error: "Маршрут не найден" });
}

function errorHandler(err, req, res, next) {
  console.error(err);

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

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return res.status(400).json({ error: message });
  }

  if (err.name === "CastError") {
    const message =
      err.kind === "ObjectId"
        ? "Некорректный id"
        : (err.reason?.message ?? `Некорректное значение поля ${err.path}`);
    return res.status(400).json({ error: message });
  }

  res
    .status(err.status || 500)
    .json({ error: err.message || "Внутренняя ошибка сервера" });
}

module.exports = { notFound, errorHandler };
