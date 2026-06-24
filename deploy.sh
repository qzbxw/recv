#!/bin/bash
# Скрипт деплоя на сервере. Выполняет резервное копирование, сборку образов на сервере и запуск.
# В случае сбоя проверки работоспособности (Health Gate) выполняет автоматический откат.
set -euo pipefail

# Переходим в директорию проекта
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== Запуск деплоя на сервере в директории $DIR ==="

# Проверяем наличие окружения
if [ ! -f .env ]; then
  echo "Ошибка: Файл .env не найден в $DIR" >&2
  exit 1
fi

if [ ! -d .git ]; then
  echo "Ошибка: Директория .git не найдена в $DIR" >&2
  exit 1
fi

# Получаем целевой коммит для деплоя (по умолчанию текущий HEAD)
DEPLOY_SHA="${1:-$(git rev-parse HEAD)}"
previous_sha="$(git rev-parse HEAD)"

echo "Текущий коммит: $previous_sha"
echo "Целевой коммит: $DEPLOY_SHA"

# Функция для обновления переменных в .env
update_env_var() {
  local var_name="$1"
  local var_value="$2"
  if grep -q "^${var_name}=" .env; then
    sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env
  else
    printf '%s=%s\n' "$var_name" "$var_value" >> .env
  fi
}

# Функция для отката
rollback() {
  echo "!!! Health Gate FAILED. Начинаем откат к предыдущей версии ($previous_sha) !!!"
  
  git checkout --force --detach "$previous_sha"
  update_env_var GHCR_IMAGE_TAG "$previous_sha"
  
  echo "Пересборка предыдущей версии..."
  docker compose build api blockchain_watcher telegram_bot_worker frontend_public frontend
  
  echo "Перезапуск контейнеров предыдущей версии..."
  docker compose up -d --remove-orphans api blockchain_watcher telegram_bot_worker frontend_public frontend caddy
  
  echo "Откат завершен."
  exit 1
}

# 1. Делаем бэкап базы данных перед обновлением
mkdir -p backups
if docker compose ps --status running postgres | grep -q postgres; then
  echo "--> Создание резервной копии базы данных..."
  backup_file="backups/predeploy-$(date -u +%Y%m%dT%H%M%SZ).sql"
  if docker compose exec -T postgres sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$backup_file"; then
    echo "Резервная копия создана: $backup_file"
  else
    echo "Предупреждение: Не удалось создать бэкап базы данных!" >&2
  fi
fi

# 2. Выполняем бэкап restic, если настроен
if grep -Eq '^RESTIC_REPOSITORY=.+$' .env && grep -Eq '^RESTIC_PASSWORD=.+$' .env; then
  echo "--> Запуск резервного копирования restic..."
  docker compose --profile ops run --rm restic backup /backup || echo "Предупреждение: Сбой резервного копирования restic" >&2
fi

# 3. Переключаемся на целевой коммит (если он отличается)
if [ "$previous_sha" != "$DEPLOY_SHA" ]; then
  echo "--> Переключение рабочей копии на коммит $DEPLOY_SHA..."
  git checkout --force --detach "$DEPLOY_SHA"
fi

# Обновляем тег в .env, чтобы docker compose использовал его
update_env_var GHCR_IMAGE_TAG "$DEPLOY_SHA"

# 4. Собираем образы локально на сервере (экономит лимиты GitHub Actions)
echo "--> Сборка Docker-образов на сервере..."
docker compose build api blockchain_watcher telegram_bot_worker frontend_public frontend

# 5. Запуск PostgreSQL (если не запущен)
docker compose up -d postgres

# 6. Запуск остальных сервисов
echo "--> Запуск обновленных сервисов..."
docker compose up -d --remove-orphans api blockchain_watcher telegram_bot_worker frontend_public frontend caddy

# 7. Проверка здоровья (Health Gate)
site_host="$(grep -E '^CADDY_SITE_ADDRESS=' .env | tail -n1 | cut -d= -f2- | tr -d '"' | sed -e 's#^https\?://##' -e 's#[:/].*##')"
site_host="${site_host:-localhost}"

echo "--> Ожидание проверки работоспособности (Health Gate)..."
healthy=0
for i in $(seq 1 60); do
  if docker compose exec -T api wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 && \
     docker compose exec -T blockchain_watcher wget -qO- http://127.0.0.1:9091/healthz >/dev/null 2>&1 && \
     docker compose exec -T telegram_bot_worker wget -qO- http://127.0.0.1:9092/healthz >/dev/null 2>&1 && \
     docker compose exec -T caddy wget -qO- --header="Host: ${site_host}" http://127.0.0.1:80/robots.txt >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" -eq 1 ]; then
  echo "=== Health Gate ПРОЙДЕН. Деплой успешно завершен! ==="
  printf '%s' "$DEPLOY_SHA" > .deploy-sha
  # Удаляем старые неиспользуемые образы для экономии места на диске
  docker image prune -f --filter "until=168h"
  exit 0
else
  # Выводим логи для диагностики перед откатом
  echo "Ошибка: Health Gate не пройден за 120 секунд. Диагностическая информация:"
  docker compose exec -T api wget -qO- http://127.0.0.1:8080/healthz || echo "api healthz: СБОЙ"
  docker compose exec -T blockchain_watcher wget -qO- http://127.0.0.1:9091/healthz || echo "watcher healthz: СБОЙ"
  docker compose exec -T telegram_bot_worker wget -qO- http://127.0.0.1:9092/healthz || echo "bot healthz: СБОЙ"
  docker compose exec -T caddy wget -qO- --header="Host: ${site_host}" http://127.0.0.1:80/robots.txt || echo "caddy robots.txt: СБОЙ (Host: ${site_host})"
  
  echo "Последние логи сервисов:"
  docker compose logs --no-color --tail=50 api blockchain_watcher telegram_bot_worker frontend_public frontend caddy
  
  # Откат
  rollback
fi
