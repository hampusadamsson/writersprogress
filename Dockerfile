FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src/ ./src/
COPY index.html ./
COPY bookprogress.config.json ./
RUN mkdir -p data
# Run extract once to generate initial dashboard
RUN pnpm extract

# ── Runtime stage ──
FROM nginx:alpine

RUN apk add --no-cache nodejs git bash coreutils

# Copy node app for scheduled extracts
COPY --from=builder /app /app
COPY --from=builder /usr/local/bin/pnpm /usr/local/bin/pnpm
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules

# Copy generated dashboard to nginx
COPY --from=builder /app/data/index.html /usr/share/nginx/html/index.html

# Entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV EXTRACT_INTERVAL=3600
ENV CONFIG_PATH=/app/bookprogress.config.json

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
