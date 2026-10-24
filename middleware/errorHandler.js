function notFound(req, res) {
  res.status(404).json({ error: "Маршрут не найден" });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Слишком большое тело запроса" });
  }

  if (err.name === "SequelizeValidationError") {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: details.map((d) => d.message).join("; "),
      details,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res
      .status(409)
      .json({ error: "Запись с такими данными уже существует" });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ error: "Связанная запись не найдена" });
  }

  const status = err.status || 500;
  if (status >= 500) {
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
  res.status(status).json({ error: err.message });
}

module.exports = { notFound, errorHandler };
