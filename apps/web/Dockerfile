# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN npm install --include=dev --no-audit --no-fund
COPY packages/types ./packages/types
COPY apps/web ./apps/web
RUN cd apps/web && npm run build

FROM nginx:alpine
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
