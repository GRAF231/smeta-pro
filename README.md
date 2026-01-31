# СметаПро — Сервис составления и отображения смет на ремонт

Веб-сервис для бригадиров и ремонтных команд, который позволяет создавать единую смету в Google Sheets и автоматически генерировать разные представления для заказчиков и мастеров.

## Ключевая идея

**Одна таблица — несколько смет.**

Бригадир работает с привычной Google Таблицей, а сервис автоматически:
- Получает данные из неё
- Отображает одну и ту же смету в разных веб-формах:
  - С **продажными расценками** — для заказчика (столбец F)
  - С **закупочными расценками** — для мастеров (столбец I)

## Структура проекта

```
valentin/
├── client/          # React приложение (Vite + TypeScript + TailwindCSS)
├── server/          # Node.js API (Express + TypeScript + SQLite)
└── package.json     # Monorepo конфигурация
```

## Требования

- Node.js 18+
- npm 9+
- Google Cloud аккаунт с включенным Google Sheets API

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Google Sheets API

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Google Sheets API
3. Создайте сервисный аккаунт и скачайте JSON ключ
4. Создайте файл `server/.env`:

```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Структура таблицы

Сервис ожидает следующую структуру колонок в Google Sheets:

| Колонка | Назначение |
|---------|------------|
| A | Номер / Раздел |
| B | Наименование работ |
| C | Единица измерения |
| D | Количество |
| E | Цена (продажная) |
| **F** | **Сумма для заказчика** |
| H | Закупочная цена |
| **I** | **Сумма для мастеров** |

## API Эндпоинты

### Аутентификация
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `GET /api/auth/me` — Текущий пользователь

### Сметы (требуется авторизация)
- `GET /api/estimates` — Список смет
- `POST /api/estimates` — Создать смету
- `PUT /api/estimates/:id` — Обновить смету
- `DELETE /api/estimates/:id` — Удалить смету

### Публичные представления
- `GET /api/estimates/customer/:token` — Смета для заказчика
- `GET /api/estimates/master/:token` — Смета для мастеров

## Технологии

### Frontend
- React 18
- TypeScript
- React Router
- Axios
- TailwindCSS

### Backend
- Node.js
- Express
- TypeScript
- better-sqlite3
- googleapis
- JWT (jsonwebtoken)
- bcryptjs

## Лицензия

MIT

