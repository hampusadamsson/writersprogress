#!/bin/bash
set -e

echo "Writing Tracker container starting..."
echo "   Extract interval: ${EXTRACT_INTERVAL}s"
echo "   Config: ${CONFIG_PATH}"

# Start nginx in background
nginx -g "daemon off;" &
NGINX_PID=$!

# Cron loop: periodically re-extract
extract_loop() {
  run_extract
  while true; do
    sleep "${EXTRACT_INTERVAL:-86400}"
    run_extract
  done
}

run_extract() {
  echo "[$(date -Iseconds)] Running extract..."
  cd /app
  if node src/extract.mjs --config "${CONFIG_PATH:-/app/bookprogress.config.json}" 2>&1; then
    cp /app/data/index.html /usr/share/nginx/html/index.html
    cp /app/data/progress.html /usr/share/nginx/html/progress.html 2>/dev/null || true
    echo "[$(date -Iseconds)] Extract complete."
  else
    echo "[$(date -Iseconds)] Extract failed, keeping previous dashboard."
  fi
}

extract_loop &
LOOP_PID=$!

# Wait for either process to exit
wait -n $NGINX_PID $LOOP_PID
