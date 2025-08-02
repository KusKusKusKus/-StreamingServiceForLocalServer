# 🚀 Быстрый старт

## Для Ubuntu Server

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd StreamingServiceForLocalServer
   ```

2. **Запустите автоматический скрипт развертывания:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Откройте браузер:**
   ```
   http://IP_ВАШЕГО_СЕРВЕРА:8081
   ```

## Для Windows/Linux с Docker Desktop

1. **Установите Docker Desktop**

2. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd StreamingServiceForLocalServer
   ```

3. **Запустите сервисы:**
   ```bash
   docker-compose up -d --build
   ```

4. **Откройте браузер:**
   ```
   http://localhost:8081
   ```

## Первые шаги

1. **Добавьте видео:**
   - Перейдите на вкладку "Add Video"
   - Вставьте URL YouTube/Rutube/VK видео
   - Нажмите "Add Video"

2. **Дождитесь обработки:**
   - Видео появится в библиотеке со статусом "Queued"
   - Система автоматически загрузит и конвертирует видео
   - Статус изменится на "Ready"

3. **Смотрите видео:**
   - Найдите готовое видео в библиотеке
   - Нажмите "Play" или на название видео

## Полезные команды

```bash
# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down

# Перезапуск
docker-compose restart

# Обновление
git pull && docker-compose up -d --build
```

## Поддерживаемые платформы

- ✅ YouTube
- ✅ Rutube
- ✅ VK
- ✅ Kinopoisk
- ✅ И многие другие через yt-dlp

## Требования

- **RAM:** Минимум 4GB
- **Диск:** 200GB свободного места
- **ОС:** Ubuntu 20.04+, Windows 10+, macOS 10.15+
- **Сеть:** Стабильное интернет-соединение

---

**Готово!** Ваш стриминговый сервис запущен и готов к использованию! 🎉 