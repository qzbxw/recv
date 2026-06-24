FROM node:22-bookworm-slim AS builder

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_SITE_URL=https://recv.money
ARG PUBLIC_APP_URL=https://recv.money
ARG GTM_ID
ARG YANDEX_METRIKA_ID
ARG GOOGLE_SITE_VERIFICATION
ARG YANDEX_VERIFICATION
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ENV GTM_ID=${GTM_ID}
ENV YANDEX_METRIKA_ID=${YANDEX_METRIKA_ID}
ENV GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION}
ENV YANDEX_VERIFICATION=${YANDEX_VERIFICATION}
ENV BACKEND_INTERNAL_URL=http://api:8080
COPY frontend-public/package*.json ./
RUN npm ci --prefer-offline=false

COPY frontend-public ./
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

USER node
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
