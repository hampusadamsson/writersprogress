#!/bin/bash
set -e

echo "📚 BookProgress container starting..."
echo "   Extract interval: ${EXTRACT_INTERVAL}s"
echo "   Config: ${CONFIG_PATH}"

# Start nginx in background
nginx -g "daemon off;" &
NGINX_PID=$!

# Cron loop: periodically re-extract
extract_loop() {
  while true; do
    sleep "${EXTRACT_INTERVAL:-3600}"
    echo "[$(date -Iseconds)] Running scheduled extract..."
    cd /app
    if node src/extract.mjs --config "${CONFIG_PATH:-/app/bookprogress.config.json}" 2>&1; then
      # Copy fresh dashboard to nginx
      cp /app/data/index.html /usr/share/nginx/html/index.html
      echo "[$(date -Iseconds)] Extract complete."
    else
      echo "[$(date -Iseconds)] Extract failed, keeping previous dashboard."
    fi
  done
}

extract_loop &
LOOP_PID=$!

# Wait for either process to exit
wait -n $NGINX_PID $LOOP_PID
