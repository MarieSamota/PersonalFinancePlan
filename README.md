# PersonalFinancePlan – сервер (Лабораторная работа 1)

REST API для управления транзакциями (доходы и расходы) системы построения
персонального финансового плана. Данные хранятся в памяти сервера (массив), без базы данных.

## Стек

- Node.js
- Express.js

## Установка и запуск

Требуется установленный Node.js (проверить командой: node -v).

    npm install
    npm run dev

Сервер запустится на http://localhost:3000
npm run dev – запуск с автоперезапуском (nodemon); npm start – обычный запуск.

## Эндпоинты

| Метод  | Путь              | Назначение                    |
| ------ | ----------------- | ----------------------------- |
| GET    | /transactions     | список всех транзакций        |
| GET    | /transactions/:id | одна транзакция по id         |
| POST   | /transactions     | создать транзакцию            |
| PUT    | /transactions/:id | полностью обновить транзакцию |
| DELETE | /transactions/:id | удалить транзакцию            |

Фильтрация списка: GET /transactions?type=income|expense и/или ?category=<строка>

Поля транзакции: amount (число > 0), type (income/expense), category (строка),
date (ГГГГ-ММ-ДД, необязательно), description (строка, необязательно).
