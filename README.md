# PersonalFinancePlan – практическое занятие №1 (Middleware и шаблонизаторы)

Система для построения персонального финансового плана. В этой ветке (`pz21`)
к серверу на Express и PostgreSQL добавлены HTML-страницы, которые сервер
генерирует через шаблонизатор EJS, а также кастомные middleware.

## Стек

- Node.js, Express.js
- EJS (шаблонизатор)
- PostgreSQL, Sequelize

## Установка и запуск

Требуется установленный Node.js и локальный PostgreSQL.

    npm install

Создать файл `.env` в корне репозитория:

    DATABASE_URL=postgres://<user>:<password>@localhost:5432/finance_plan

Применить миграции и наполнить базу тестовыми данными:

    npm run db:migrate
    npm run db:seed

Запустить сервер:

    npm start

Сервер запустится на http://localhost:3000

## Страницы

Все страницы, кроме /login, доступны только при наличии в адресе параметра
`?auth=1` (имитация авторизации). Без него происходит редирект на /login.

| Метод | Путь        | Назначение                                |
| ----- | ----------- | ------------------------------------------ |
| GET   | /           | список транзакций                          |
| GET   | /item/:id   | детальная страница транзакции              |
| GET   | /add        | форма добавления                           |
| POST  | /add        | сохранение новой транзакции, редирект на / |
| GET   | /admin/logs | содержимое файла логов запросов            |
| GET   | /login      | страница «требуется авторизация»           |

Пример: http://localhost:3000/?auth=1

## Middleware

- `middleware/requestLogger.js` – выводит в консоль и дописывает в файл
  `logs/access.log` время, метод и URL каждого запроса.
- `middleware/fakeAuth.js` – проверяет наличие `?auth=1`, иначе редирект на /login.
- `middleware/errorHandler.js` – страницы 404 и 500 (EJS) для страниц сайта и
  ответы в формате JSON для API `/transactions`.
- Встроенные: `express.json()`, `express.urlencoded()`, `express.static("public")`.

## REST API

Эндпоинты `/transactions` (GET, POST, PUT, DELETE) из предыдущих лабораторных
работ сохранены без изменений и по-прежнему отвечают в формате JSON.