# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN apk add --no-cache git bash
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.base.json ./
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/types/package.json ./packages/types/
RUN npm install --include=dev --no-audit --no-fund
COPY packages/types ./packages/types
COPY apps/mobile ./apps/mobile
WORKDIR /repo/apps/mobile
ENV EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPOSE 8081 19000 19006
CMD ["npx", "expo", "start", "--web", "--port", "19006", "--non-interactive"]
