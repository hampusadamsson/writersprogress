FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src/ ./src/
COPY bookprogress.config.json ./
RUN mkdir -p data
# Run extract once to generate initial dashboard (ignore failure in build)
RUN pnpm extract || true

# ── Runtime stage ──
FROM nginx:alpine

RUN apk add --no-cache nodejs git bash coreutils

# Copy node app for scheduled extracts
COPY --from=builder /app /app
COPY --from=builder /usr/local/bin/pnpm /usr/local/bin/pnpm
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules

# Placeholder page - replaced by first extract at runtime
RUN echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BookProgress</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#e6edf3}</style></head><body><div style="text-align:center"><h1>📚 BookProgress</h1><p>Dashboard loading soon&hellip;</p></div></body></html>' > /usr/share/nginx/html/index.html

# Entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV EXTRACT_INTERVAL=3600
ENV CONFIG_PATH=/app/bookprogress.config.json

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
