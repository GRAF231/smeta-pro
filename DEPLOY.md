# Инструкция по деплою СметаПро

## Вариант 1: VPS / Dedicated Server

### 1. Требования
- Node.js 18+
- npm 9+
- PM2 (для управления процессами)

### 2. Установка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd valentin

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### 3. Настройка переменных окружения

Создайте файл `server/.env`:

```env
PORT=4000
NODE_ENV=production
JWT_SECRET=ваш-очень-секретный-ключ-минимум-32-символа

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=smeta-service@smeta-486015.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Запуск с PM2

```bash
# Установите PM2 глобально
npm install -g pm2

# Запустите сервер
cd server
pm2 start dist/index.js --name smeta-api

# Сохраните конфигурацию
pm2 save
pm2 startup
```

### 5. Настройка Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (статические файлы)
    location / {
        root /path/to/valentin/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Вариант 2: Railway / Render / Fly.io

### Railway

1. Создайте аккаунт на [railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения:
   - `PORT` = 4000
   - `JWT_SECRET` = ваш-секретный-ключ
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = ...
   - `GOOGLE_PRIVATE_KEY` = ...
4. Railway автоматически обнаружит Node.js и запустит проект

### Render

1. Создайте Web Service на [render.com](https://render.com)
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Добавьте Environment Variables

---

## Вариант 3: Docker

### Dockerfile (создайте в корне проекта)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

### Запуск

```bash
docker build -t smeta-pro .
docker run -p 4000:4000 --env-file server/.env smeta-pro
```

---

## После деплоя

1. Убедитесь, что сервисный аккаунт Google имеет доступ к таблицам
2. Проверьте работу API: `https://your-domain.com/api/health`
3. Настройте SSL сертификат (Let's Encrypt)

## Важно!

- Никогда не коммитьте файл `.env` в репозиторий
- Используйте сложный `JWT_SECRET` на продакшене
- Регулярно делайте бэкапы базы данных (`server/data/smeta.db`)

