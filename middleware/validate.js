const MESSAGES = {
  "object.base": "Тело запроса должно быть JSON-объектом",
  "object.min": "Передайте хотя бы одно поле для изменения",
  "object.unknown": "Поле {{#label}} не разрешено",
  "any.required": "Поле {{#label}} обязательно",
  "any.only": "Поле {{#label}} должно быть одним из значений: {{#valids}}",
  "string.base": "Поле {{#label}} должно быть строкой",
  "string.empty": "Поле {{#label}} не может быть пустым",
  "string.max": "Поле {{#label}} – не длиннее {{#limit}} символов",
  "string.pattern.name": "Поле {{#label}} должно быть месяцем в формате ГГГГ-ММ (1900–2099)",
  "number.base": "Поле {{#label}} должно быть числом",
  "number.positive": "Поле {{#label}} должно быть больше нуля",
  "number.min": "Поле {{#label}} должно быть не меньше {{#limit}}",
  "number.max": "Поле {{#label}} слишком большое",
  "number.precision": "Поле {{#label}} – не больше {{#limit}} знаков после запятой",
  "boolean.base": "Поле {{#label}} должно быть true или false",
  "array.base": "Поле {{#label}} должно быть массивом",
  "date.format": "Поле {{#label}} должно быть датой в формате ГГГГ-ММ-ДД (1900–2099)",
};

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body ?? {}, {
      abortEarly: false,
      errors: { wrap: { label: false } },
      messages: MESSAGES,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return res.status(400).json({
        error: details.map((d) => d.message).join("; "),
        details,
      });
    }

    req.body = value;
    next();
  };
}

module.exports = validate;
