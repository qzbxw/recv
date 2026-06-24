#!/bin/bash
# Локальный скрипт для запуска деплоя на сервере по SSH.
# Скрипт отправляет последние изменения в git, заходит на сервер, скачивает коммит и запускает deploy.sh.
set -euo pipefail

# Загружаем настройки из .env, если он существует
if [ -f .env ]; then
  # Читаем переменные DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH, DEPLOY_KEY
  # Экспортируем их, чтобы они были доступны в скрипте
  eval "$(grep -E '^(DEPLOY_HOST|DEPLOY_USER|DEPLOY_PATH|DEPLOY_KEY)=' .env | xargs)"
fi

# Настройки по умолчанию
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/recv}"
DEPLOY_KEY="${DEPLOY_KEY:-}"

# Функция справки
usage() {
  echo "Использование: $0 [user@host] [/path/to/remote/repo] [key_path]"
  echo "Или настройте переменные в .env:"
  echo "  DEPLOY_HOST=server_ip"
  echo "  DEPLOY_USER=root"
  echo "  DEPLOY_PATH=/root/recv"
  echo "  DEPLOY_KEY=~/.ssh/id_rsa (опционально)"
  exit 1
}

# Обработка аргументов командной строки
if [ $# -ge 1 ]; then
  if [[ "$1" == *"@"* ]]; then
    DEPLOY_USER="${1%%@*}"
    DEPLOY_HOST="${1#*@}"
  else
    DEPLOY_HOST="$1"
  fi
fi

if [ $# -ge 2 ]; then
  DEPLOY_PATH="$2"
fi

if [ $# -ge 3 ]; then
  DEPLOY_KEY="$3"
fi

# Проверяем, задан ли хост
if [ -z "$DEPLOY_HOST" ]; then
  echo "Ошибка: Не указан DEPLOY_HOST. Задайте его в .env или передайте аргументом." >&2
  usage
fi

echo "=== Подготовка локального деплоя на $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH ==="

# Проверяем наличие незакоммиченных изменений
if ! git diff-index --quiet HEAD --; then
  echo "Предупреждение: У вас есть незакоммиченные изменения. Они не будут задеплоены, так как сервер скачивает код из репозитория GitHub."
  read -p "Продолжить деплой последнего коммита? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Деплой отменен."
    exit 1
  fi
fi

# Получаем текущую ветку и SHA коммита
BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
COMMIT_SHA="$(git rev-parse HEAD)"

echo "Текущая ветка: $BRANCH_NAME"
echo "Деплоим коммит SHA: $COMMIT_SHA"

# Пушим изменения в репозиторий, чтобы сервер мог их получить
echo "--> Отправка изменений в origin ($BRANCH_NAME)..."
git push origin "$BRANCH_NAME"

# Опция для SSH-ключа
SSH_OPTS=""
if [ -n "$DEPLOY_KEY" ]; then
  SSH_OPTS="-i $DEPLOY_KEY"
fi

echo "--> Подключение по SSH и запуск сборки/деплоя на сервере..."
ssh -t $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" "
  set -eu
  cd '$DEPLOY_PATH'
  echo 'Обновление репозитория на сервере...'
  git fetch --prune origin
  # Запускаем deploy.sh с передачей SHA-коммита
  ./deploy.sh '$COMMIT_SHA'
"

echo "=== Деплой успешно инициирован и завершен! ==="
