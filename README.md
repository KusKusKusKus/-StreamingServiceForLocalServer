# Streaming Service for Local Server

Полнофункциональный стриминговый сервис для локального сервера с поддержкой YouTube, Rutube, VK, Kinopoisk и других платформ.

## 🚀 Возможности

- **Множественные источники**: YouTube, Rutube, VK, Kinopoisk и другие через yt-dlp
- **Автоматическая загрузка**: Фоновая обработка видео в очереди
- **HLS стриминг**: Современный формат для адаптивного стриминга
- **Веб-интерфейс**: Современный React фронтенд
- **REST API**: Полнофункциональный .NET Core API
- **База данных**: PostgreSQL для хранения метаданных
- **Docker**: Полная контейнеризация для простого развертывания

## 🏗️ Архитектура

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  PostgreSQL │
│   (React)   │◄──►│  (.NET Core)│◄──►│   Database  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │   Redis     │            │
       │            │   Cache     │            │
       │            └─────────────┘            │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │    │   yt-dlp    │    │   FFmpeg    │
│   Reverse   │    │  Downloader │    │  Converter  │
│   Proxy     │    └─────────────┘    └─────────────┘
└─────────────┘
```

## 📋 Требования

- Docker и Docker Compose
- Ubuntu Server (рекомендуется)
- Минимум 4GB RAM
- 200GB свободного места для видео

## 🛠️ Установка и развертывание

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd StreamingServiceForLocalServer
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корневой директории:

```env
# Database
POSTGRES_DB=streamservice
POSTGRES_USER=streamuser
POSTGRES_PASSWORD=streampass123

# Storage
VIDEO_STORAGE_PATH=/var/lib/streamservice/videos
MAX_STORAGE_GB=200

# API
API_BASE_URL=http://localhost
```

### 3. Запуск сервисов

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 4. Доступ к приложению

- **Веб-интерфейс**: http://localhost:8080
- **API документация**: http://localhost:8080/swagger
- **База данных**: localhost:5433
- **Redis**: localhost:6380

## 📖 Использование

### Добавление видео

1. Откройте веб-интерфейс
2. Перейдите на вкладку "Add Video"
3. Вставьте URL видео (YouTube, Rutube, VK, etc.)
4. Нажмите "Add Video"

### Просмотр видео

1. Перейдите в "Library"
2. Найдите готовое видео (статус "Ready")
3. Нажмите "Play" или на название видео

### API Endpoints

```bash
# Получить список видео
GET /api/videos

# Добавить видео
POST /api/videos
{
  "url": "https://www.youtube.com/watch?v=...",
  "title": "Optional custom title"
}

# Получить статус системы
GET /api/videos/status

# Стриминг видео
GET /api/videos/{id}/stream
```

## 🔧 Конфигурация

### Настройка Nginx

Файл `docker/nginx.conf` содержит конфигурацию для:
- Проксирования API запросов
- Стриминга видео
- Кэширования
- Rate limiting

### Настройка базы данных

Файл `docker/init-db.sql` создает:
- Таблицу `videos` для метаданных
- Таблицу `users` для будущей аутентификации
- Индексы для оптимизации

### Ограничения хранилища

В `docker-compose.yml` настроено ограничение в 200GB:
```yaml
environment:
  - Storage__MaxSizeGB=200
```

## 🚨 Мониторинг и логи

### Просмотр логов

```bash
# Логи бэкенда
docker-compose logs -f backend

# Логи фронтенда
docker-compose logs -f frontend

# Логи базы данных
docker-compose logs -f postgres
```

### Мониторинг ресурсов

```bash
# Использование диска
docker system df

# Статистика контейнеров
docker stats
```

## 🔒 Безопасность

### Рекомендации для продакшена

1. **Измените пароли** в `docker-compose.yml`
2. **Настройте SSL** с Let's Encrypt
3. **Ограничьте доступ** к API
4. **Настройте брандмауэр**
5. **Регулярно обновляйте** контейнеры

### Настройка SSL

```bash
# Создание SSL сертификатов
sudo certbot certonly --standalone -d your-domain.com

# Обновление nginx.conf для HTTPS
```

## 🐛 Устранение неполадок

### Проблемы с загрузкой видео

```bash
# Проверка yt-dlp
docker-compose exec backend yt-dlp --version

# Проверка FFmpeg
docker-compose exec backend ffmpeg -version

# Просмотр логов загрузки
docker-compose logs -f backend | grep "VideoDownloadService"
```

### Проблемы с базой данных

```bash
# Подключение к базе
docker-compose exec postgres psql -U streamuser -d streamservice

# Проверка таблиц
\dt

# Проверка данных
SELECT * FROM videos LIMIT 5;
```

### Проблемы с сетью

```bash
# Проверка портов
netstat -tulpn | grep :80
netstat -tulpn | grep :5432

# Проверка контейнеров
docker-compose ps
```

## 📈 Производительность

### Оптимизации

1. **Кэширование**: Redis для сессий и кэша
2. **Сжатие**: Nginx gzip для статических файлов
3. **CDN**: Настройка CDN для видео файлов
4. **Балансировка**: Настройка load balancer

### Мониторинг производительности

```bash
# Установка Grafana
docker run -d --name=grafana -p 3000:3000 grafana/grafana

# Установка Prometheus
# (добавить в docker-compose.yml)
```

## 🔄 Обновления

### Обновление приложения

```bash
# Остановка сервисов
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose up -d --build
```

### Резервное копирование

```bash
# Резервная копия базы данных
docker-compose exec postgres pg_dump -U streamuser streamservice > backup.sql

# Резервная копия видео
tar -czf videos_backup.tar.gz /var/lib/streamservice/videos
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🆘 Поддержка

- Создайте Issue в GitHub
- Проверьте документацию
- Посмотрите логи для диагностики

---

**Примечание**: Этот сервис предназначен для личного использования. Убедитесь, что вы соблюдаете условия использования платформ, с которых загружаете контент. 