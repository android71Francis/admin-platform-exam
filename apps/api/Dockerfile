# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN npm install --include=dev --no-audit --no-fund

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY tsconfig.base.json turbo.json package.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx tsc

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/types ./packages/types
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma
COPY --from=builder /repo/apps/api/package.json ./package.json
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/prisma/seed.js && node dist/src/index.js"]
