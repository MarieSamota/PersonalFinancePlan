# PersonalFinancePlan

Система для построения персонального финансового плана: учёт транзакций
(доходов и расходов), цели накоплений, аутентификация пользователей и
клиентское React-приложение. Курсовой проект, выполняется поэтапно в рамках
лабораторных работ.

## Структура репозитория

- Корень репозитория – серверная часть (REST API, Express + PostgreSQL +
  MongoDB).
- `client/` – клиентское React-приложение, работает с REST API сервера
  через axios (Лабораторная работа 5).

## Сервер

### Стек

- Node.js, Express.js
- PostgreSQL, Sequelize (миграции, сиды) – пользователи и транзакции
- MongoDB Atlas, Mongoose – цели накоплений (Лабораторная работа 6)
- JWT (jsonwebtoken), bcrypt – аутентификация
- cors – разрешение запросов от клиента (http://localhost:5173)

### Установка и запуск

Требуется установленный Node.js, локальный PostgreSQL и кластер MongoDB
Atlas (бесплатный M0) с пользователем базы данных и разрешённым IP-адресом.

    npm install

Создать файл `.env` в корне репозитория:

    DATABASE_URL=postgres://<user>:<password>@localhost:5432/finance_plan
    JWT_SECRET=<секретная строка>
    MONGO_URI=mongodb+srv://<user>:<password>@<кластер>.mongodb.net/finance_plan?retryWrites=true&w=majority

Строку подключения выдаёт Atlas: Connect → Drivers. Если DNS сети не
отвечает на SRV/TXT-запросы (ошибка `queryTxt ESERVFAIL`), используется
полная форма строки без `+srv`: `mongodb://<user>:<password>@<хост1>:27017,<хост2>:27017,<хост3>:27017/finance_plan?tls=true&replicaSet=<имя>&authSource=admin`.

Применить миграции и наполнить базу тестовыми данными:

    npm run db:migrate
    npm run db:seed

Заполнить MongoDB демо-целями для пользователя (он должен быть
зарегистрирован в PostgreSQL):

    npm run mongo:seed -- <email>

Запустить сервер:

    npm run dev

Сервер запустится на http://localhost:3000
`npm run dev` – запуск с автоперезапуском (nodemon); `npm start` – обычный запуск.

### Эндпоинты

**Транзакции** (требуют заголовок `Authorization: Bearer <токен>`)

| Метод  | Путь              | Назначение                    |
| ------ | ----------------- | ------------------------------ |
| GET    | /transactions     | список всех транзакций        |
| GET    | /transactions/:id | одна транзакция по id         |
| POST   | /transactions     | создать транзакцию            |
| PUT    | /transactions/:id | полностью обновить транзакцию |
| DELETE | /transactions/:id | удалить транзакцию            |

Фильтрация списка: `GET /transactions?type=income|expense` и/или `?category=<строка>`

Поиск: `GET /transactions?search=<строка>` – подстрока в категории или
описании без учёта регистра.

Поля транзакции: `amount` (число > 0), `type` (income/expense), `category`
(строка), `date` (ГГГГ-ММ-ДД, необязательно), `description` (строка,
необязательно), `isRecurring` (bool, необязательно).

**Аутентификация**

| Метод | Путь                     | Назначение                          |
| ----- | ------------------------ | ------------------------------------ |
| POST  | /auth/register           | регистрация пользователя             |
| POST  | /auth/login               | вход, выдаёт JWT                    |
| GET   | /auth/verify-email/:token | подтверждение email                 |
| GET   | /profile                  | профиль текущего пользователя (JWT) |

**Цели накоплений** (MongoDB, требуют заголовок `Authorization: Bearer <токен>`;
пользователь видит и меняет только свои цели)

| Метод  | Путь                                     | Назначение                               |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | /goals                                   | список целей                             |
| GET    | /goals/stats                             | сумма взносов по месяцам (агрегация)     |
| GET    | /goals/:id                               | одна цель                                |
| POST   | /goals                                   | создать цель                             |
| PUT    | /goals/:id                               | изменить цель                            |
| DELETE | /goals/:id                               | удалить цель (в ответе удалённая цель)   |
| POST   | /goals/:id/contributions                 | добавить взнос                           |
| PATCH  | /goals/:id/contributions/:contributionId | изменить взнос                           |
| DELETE | /goals/:id/contributions/:contributionId | удалить взнос                            |
| POST   | /goals/:id/tags                          | добавить тег (`{ "tag": "..." }`)        |
| DELETE | /goals/:id/tags/:tag                     | убрать тег                               |

Параметры списка: `?tag=<тег>`, `?search=<строка>` (подстрока в названии без
учёта регистра), `?status=active|reached`, `?page=<номер>&limit=<1–50>`.
Ответ списка: `{ goals, total, page, limit }`.

Поля цели: `title` (строка, до 100 символов), `targetAmount` (число ≥ 1),
`deadline` (ГГГГ-ММ-ДД, необязательно), `tags` (массив строк, необязательно).
Поля взноса: `amount` (число > 0), `date` (ГГГГ-ММ-ДД, по умолчанию –
текущая дата), `note` (строка, до 200 символов, необязательно). В ответе
у цели есть вычисляемые поля `savedAmount`, `progress` (%) и `status`.

## Клиент (`client/`)

React-приложение на Vite. Вход по email и паролю, список транзакций
загружается с сервера, добавление, редактирование и удаление отражаются
в интерфейсе после подтверждения сервером (пессимистичное обновление). Поиск по транзакциям выполняется
на сервере с задержкой (debounce) ввода.

Перед запуском сервер должен быть запущен (см. выше).

    cd client
    npm install

Создать файл `client/.env` по образцу `client/.env.example`:

    VITE_API_URL=http://localhost:3000

Запустить клиент:

    npm run dev

Откроется на http://localhost:5173. Для входа нужен пользователь с
подтверждённым email (регистрация – `POST /auth/register`, ссылка
подтверждения выводится в консоль сервера; примеры запросов – в
`requests.http`).
