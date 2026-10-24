# PersonalFinancePlan – документация REST API

Сервер: `http://localhost:3000`. Интерактивная документация (Swagger UI): `http://localhost:3000/api-docs`, спецификация OpenAPI – `docs/openapi.yaml`.

## Общие правила

**Формат.** Тела запросов и ответов – JSON, заголовок `Content-Type: application/json`.

**Аутентификация.** Все маршруты, кроме `/auth/*`, требуют заголовок

    Authorization: Bearer <токен из POST /auth/login>

Каждый пользователь видит и меняет только свои записи. Чужая запись для него не существует – ответ 404.

**Ресурсы.** Имена во множественном числе (`/transactions`, `/goals`, `/budgets`), действия задаются HTTP-методом:

| Метод | Путь | Назначение | Успех |
|---|---|---|---|
| GET | `/resource` | список | 200 |
| GET | `/resource/:id` | одна запись | 200 |
| POST | `/resource` | создание | 201 + заголовок `Location` |
| PUT | `/resource/:id` | полная замена (непереданные необязательные поля сбрасываются) | 200 |
| PATCH | `/resource/:id` | частичное обновление (меняются только переданные поля) | 200 |
| DELETE | `/resource/:id` | удаление | 204 без тела |

**Ошибки.** Единый формат – поле `error` (строка); при ошибке валидации дополнительно `details` по полям:

```json
{
  "error": "Поле amount должно быть числом; Поле category обязательно",
  "details": [
    { "field": "amount", "message": "Поле amount должно быть числом" },
    { "field": "category", "message": "Поле category обязательно" }
  ]
}
```

| Код | Когда |
|---|---|
| 400 | невалидное тело (нет обязательного поля, неверный тип, лишнее поле, пустой PATCH), некорректный id, битый JSON |
| 401 | нет токена, токен неверный или просрочен; неверный email или пароль при входе |
| 403 | вход с неподтверждённым email |
| 404 | запись не найдена (или принадлежит другому пользователю), неизвестный маршрут |
| 409 | конфликт: бюджет на эту категорию и месяц уже есть |
| 413 | слишком большое тело запроса |
| 500 | внутренняя ошибка сервера (подробности только в консоли сервера) |

**Типы данных.** Суммы – число больше нуля, не больше двух знаков после запятой (строка `"100"` не принимается). Даты – `ГГГГ-ММ-ДД`, месяц – `ГГГГ-ММ`, годы 1900–2099. id – целое число больше нуля.

---

## 1. Аутентификация

| Метод | URL | Описание | Тело запроса | Ответ |
|---|---|---|---|---|
| POST | `/auth/register` | регистрация | `{ "email", "password" }` | 201 `{ id, email, isVerified }` |
| GET | `/auth/verify-email/:token` | подтверждение email (ссылка печатается в консоли сервера) | – | 200 `{ message }` |
| POST | `/auth/login` | вход | `{ "email", "password" }` | 200 `{ token }` |
| GET | `/profile` | текущий пользователь | – | 200 `{ id, email, isVerified }` |

### POST /auth/login

Запрос:
```json
{ "email": "maria@example.com", "password": "supersecret1" }
```
Ответ 200:
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```
Ошибки: 400 – неверный формат email или пустой пароль; 401 `{"error": "Неверный email или пароль"}`; 403 `{"error": "Email не подтверждён"}`.

### POST /auth/register

Ответ 201: `{ "id": 5, "email": "maria@example.com", "isVerified": false }`. Ошибки: 400 – неверные данные или `"Пользователь с таким email уже зарегистрирован"`.

---

## 2. Транзакции `/transactions`

Поля:

| Поле | Тип | POST / PUT | Ограничения |
|---|---|---|---|
| amount | number | обязательно | > 0, до 2 знаков после запятой |
| type | string | обязательно | `income` или `expense` |
| category | string | обязательно | непустая, до 255 символов |
| date | string | по умолчанию сегодня | `ГГГГ-ММ-ДД` |
| description | string | по умолчанию `""` | до 255 символов |
| isRecurring | boolean | по умолчанию `false` | только `true` / `false` |

`id`, `userId`, `createdAt`, `updatedAt` задаёт сервер; передать их в теле нельзя (400 «Поле … не разрешено»).

| Метод | URL | Описание | Пример тела | Ответ |
|---|---|---|---|---|
| GET | `/transactions?type=&category=&search=` | список своих транзакций | – | 200, массив |
| GET | `/transactions/:id` | одна транзакция | – | 200 / 404 |
| POST | `/transactions` | создать | `{"amount": 12.5, "type": "expense", "category": "Кофе"}` | 201 + Location |
| PUT | `/transactions/:id` | полная замена | `{"amount": 15, "type": "expense", "category": "Кофе"}` | 200 |
| PATCH | `/transactions/:id` | частичное обновление | `{"description": "Латте"}` | 200 |
| DELETE | `/transactions/:id` | удалить | – | 204 |

Параметры строки запроса для списка: `type` – `income` / `expense`; `category` – точное совпадение без учёта регистра; `search` – подстрока в категории или описании (символы `%` и `_` ищутся буквально). Пример: `GET /transactions?type=expense&search=кофе`.

### POST /transactions

Запрос:
```json
{
  "amount": 12.5,
  "type": "expense",
  "category": "Кофе",
  "date": "2026-10-20",
  "description": "Капучино",
  "isRecurring": false
}
```
Ответ 201, заголовок `Location: /transactions/54`:
```json
{
  "id": 54,
  "userId": 5,
  "amount": 12.5,
  "type": "expense",
  "category": "Кофе",
  "date": "2026-10-20",
  "description": "Капучино",
  "isRecurring": false,
  "createdAt": "2026-10-24T00:32:04.500Z",
  "updatedAt": "2026-10-24T00:32:04.500Z"
}
```
Ошибка 400 на `{"amount": "100", "type": "покупка"}`:
```json
{
  "error": "Поле amount должно быть числом; Поле type должно быть одним из значений: [income, expense]; Поле category обязательно",
  "details": [
    { "field": "amount", "message": "Поле amount должно быть числом" },
    { "field": "type", "message": "Поле type должно быть одним из значений: [income, expense]" },
    { "field": "category", "message": "Поле category обязательно" }
  ]
}
```

### PUT и PATCH /transactions/:id

PUT `{"amount": 15, "type": "expense", "category": "Кофе"}` заменяет транзакцию целиком: `date` становится сегодняшней, `description` – `""`, `isRecurring` – `false`.

PATCH `{"description": "Латте"}` меняет только описание, остальные поля остаются прежними. Пустой PATCH `{}` – 400 `"Передайте хотя бы одно поле для изменения"`.

Ошибки обоих: 400 (валидация, `"Некорректный id"` для `/transactions/abc`), 404 `"Транзакция не найдена"`.

---

## 3. Цели накоплений `/goals`

Поля цели:

| Поле | Тип | POST / PUT | Ограничения |
|---|---|---|---|
| title | string | обязательно | непустое, до 100 символов |
| targetAmount | number | обязательно | от 1, до 2 знаков после запятой |
| deadline | string \| null | по умолчанию `null` | `ГГГГ-ММ-ДД` |
| tags | string[] | по умолчанию `[]` | до 50 символов; приводятся к нижнему регистру, повторы удаляются |

В ответе также вычисляемые `savedAmount` (сумма взносов), `progress` (0–100 %), `status` (`active` / `reached`) и массив `contributions`.

| Метод | URL | Описание | Пример тела | Ответ |
|---|---|---|---|---|
| GET | `/goals?page=&limit=&tag=&search=&status=` | список с пагинацией | – | 200 `{ goals, total, page, limit }` |
| GET | `/goals/stats` | сумма и число взносов по месяцам | – | 200 `[{ month, total, count }]` |
| GET | `/goals/:id` | цель со взносами | – | 200 / 404 |
| POST | `/goals` | создать | `{"title": "Новый ноутбук", "targetAmount": 2500}` | 201 + Location |
| PUT | `/goals/:id` | полная замена | `{"title": "Ноутбук для учёбы", "targetAmount": 3000}` | 200 |
| PATCH | `/goals/:id` | частичное обновление | `{"deadline": "2027-06-01"}` | 200 |
| DELETE | `/goals/:id` | удалить вместе со взносами | – | 204 |
| POST | `/goals/:id/contributions` | добавить взнос | `{"amount": 300, "date": "2026-10-10", "note": "подработка"}` | 201, цель |
| PATCH | `/goals/:id/contributions/:contributionId` | изменить взнос | `{"amount": 350}` | 200, цель |
| DELETE | `/goals/:id/contributions/:contributionId` | удалить взнос | – | 200, цель |
| POST | `/goals/:id/tags` | добавить тег | `{"tag": "Учёба"}` | 200, цель |
| DELETE | `/goals/:id/tags/:tag` | удалить тег | – | 200, цель |

Параметры списка: `page` (от 1, по умолчанию 1), `limit` (1–50, по умолчанию 10), `tag`, `search` (подстрока в названии), `status` (`active` / `reached`).

### POST /goals

Запрос:
```json
{ "title": "Новый ноутбук", "targetAmount": 2500, "deadline": "2027-03-01", "tags": ["Техника", "учёба"] }
```
Ответ 201, `Location: /goals/16`:
```json
{
  "id": 16,
  "userId": 5,
  "title": "Новый ноутбук",
  "targetAmount": 2500,
  "deadline": "2027-03-01",
  "tags": ["техника", "учёба"],
  "savedAmount": 0,
  "progress": 0,
  "status": "active",
  "contributions": [],
  "createdAt": "2026-10-24T00:32:04.531Z",
  "updatedAt": "2026-10-24T00:32:04.531Z"
}
```

### POST /goals/:id/contributions

Взнос: `amount` – обязательно (> 0), `date` – по умолчанию сегодня, `note` – до 200 символов. Ответ 201 – цель целиком с пересчитанными `savedAmount` и `progress`:
```json
{
  "id": 16,
  "title": "Новый ноутбук",
  "targetAmount": 2500,
  "savedAmount": 300,
  "progress": 12,
  "status": "active",
  "contributions": [
    { "id": 23, "goalId": 16, "amount": 300, "date": "2026-10-10", "note": "подработка" }
  ]
}
```

### GET /goals/stats

```json
[{ "month": "2026-10", "total": 350, "count": 1 }]
```

Ошибки целей: 400 (например, `{"title": "", "targetAmount": 0.5}` → `"Поле title не может быть пустым; Поле targetAmount должно быть не меньше 1"`), 404 `"Цель не найдена"`, `"Цель или взнос не найдены"`, `"Цель или тег не найдены"`.

---

## 4. Бюджеты `/budgets`

Месячный лимит расходов по категории. У пользователя может быть только один бюджет на пару «категория + месяц».

| Поле | Тип | POST / PUT | Ограничения |
|---|---|---|---|
| category | string | обязательно | непустая, до 100 символов |
| limitAmount | number | обязательно | > 0, до 2 знаков после запятой |
| month | string | обязательно | `ГГГГ-ММ` |

| Метод | URL | Описание | Пример тела | Ответ |
|---|---|---|---|---|
| GET | `/budgets?month=&category=` | список (новые месяцы первыми) | – | 200, массив |
| GET | `/budgets/:id` | один бюджет | – | 200 / 404 |
| POST | `/budgets` | создать | `{"category": "Продукты", "limitAmount": 300, "month": "2026-10"}` | 201 + Location / 409 |
| PUT | `/budgets/:id` | полная замена (все поля обязательны) | `{"category": "Продукты", "limitAmount": 350, "month": "2026-10"}` | 200 / 409 |
| PATCH | `/budgets/:id` | частичное обновление | `{"limitAmount": 400}` | 200 / 409 |
| DELETE | `/budgets/:id` | удалить | – | 204 |

### POST /budgets

Ответ 201, `Location: /budgets/18`:
```json
{
  "id": 18,
  "userId": 5,
  "category": "Продукты",
  "limitAmount": 300,
  "month": "2026-10",
  "createdAt": "2026-10-24T00:32:04.583Z",
  "updatedAt": "2026-10-24T00:32:04.583Z"
}
```
Повторный POST с той же категорией и месяцем – 409:
```json
{ "error": "Бюджет на категорию «Продукты» за 2026-10 уже существует" }
```
Неверные данные `{"category": "Транспорт", "limitAmount": 0, "month": "2026-13"}` – 400:
```json
{
  "error": "Поле limitAmount должно быть больше нуля; Поле month должно быть месяцем в формате ГГГГ-ММ (1900–2099)",
  "details": [
    { "field": "limitAmount", "message": "Поле limitAmount должно быть больше нуля" },
    { "field": "month", "message": "Поле month должно быть месяцем в формате ГГГГ-ММ (1900–2099)" }
  ]
}
```
PATCH, который переносит бюджет на уже занятый месяц, тоже даёт 409. Ошибки: 400, 404 `"Бюджет не найден"`, 409.

---

## Тестирование

API проверено в Postman: запросы с автотестами на все эндпоинты – успешные сценарии и ошибки 400, 401, 404, 409, доступ к чужим данным. Для быстрой ручной проверки в репозитории есть `requests.http` (расширение REST Client для VS Code).
