FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src/ ./src/
COPY index.html progress.html index2.html bookprogress.config.json ./
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
RUN echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27><rect width=%2716%27 height=%2716%27 rx=%273%27 fill=%27%23161b22%27/><text x=%278%27 y=%2712%27 text-anchor=%27middle%27 font-size=%2711%27 fill=%27%2358a6ff%27>W</text></svg>"><title>Writing Tracker</title><style>body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#e6edf3}div{text-align:center}h1{font-size:1.5rem;font-weight:600;margin-bottom:8px}p{color:#8b949e;font-size:0.9rem}</style></head><body><div><h1>Writing Tracker</h1><p>Dashboard will appear after first extract completes.</p></div></body></html>' > /usr/share/nginx/html/index.html

# Entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV EXTRACT_INTERVAL=86400
ENV CONFIG_PATH=/app/bookprogress.config.json

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
