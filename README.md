# Admin Platform

A containerized full-stack admin platform with a React.js web admin SPA, an Express.js + Prisma REST API, PostgreSQL storage, and an Expo React Native screen for end-users to view content assigned to them.

Boots end-to-end with a single `docker-compose up`. No cloud services required.

## Architecture

```
                       ┌──────────────────┐
       browser ──HTTP──▶ web (nginx :3000)│
                       │  proxies /api/*  │
                       └────────┬─────────┘
                                │ /api/*
                                ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│ mobile :19006│──HTTP──▶│  api :4000   │──TCP───▶│ postgres :5432   │
│ (Expo web)   │         │  Express +   │         │  Prisma-managed  │
└──────────────┘         │   Prisma     │         │  schema          │
                         └──────────────┘         └──────────────────┘
```

## Prerequisites

Only Docker + Docker Compose. No Node, no PostgreSQL, no Xcode/Android Studio needed for the demo path.
For local development outside Docker: Node.js 20+ and PostgreSQL 16+.

## Quick Start

```bash
git clone <this-repo> exam
cd admin-platform-exam
docker-compose up --build
```

Once all four services report ready:

| Service | URL |
|---------|-----|
| Web admin | http://localhost:3000 |
| Mobile (Expo web) | http://localhost:19006 |
| REST API | http://localhost:4000/api |
| API health check | http://localhost:4000/api/health |

## Default Credentials (seeded)

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `password` | FULL in both seeded orgs |
| `alice@example.com` | `password` | FULL in Alpha Corp |
| `bob@example.com` | `password` | READ in Alpha Corp |
| `carol@example.com` | `password` | READ in Beta Inc |

For the mobile screen demo, sign in as `alice@example.com` to see content assigned to her.

## Local Development (outside Docker)

```bash
# 1. Install dependencies once at the root
npm install

# 2. Start PostgreSQL (pick one)
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
# OR use a locally installed Postgres

# 3. Set up environment
cp .env.example .env

# 4. Run migrations and seed
npm run db:migrate --workspace=@admin-platform-exam/api
npm run db:seed   --workspace=@admin-platform-exam/api

# 5. Start all three apps with hot reload
npm run dev
```

The API runs at :4000, the web admin at http://localhost:5173 (Vite proxies `/api/*` to the API), and Expo CLI prints a QR code for the mobile app.

## Project Structure

```
admin-platform-exam/
├── apps/
│   ├── api/                 Express + Prisma REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── lib/
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   └── tests/           Jest + Supertest integration tests
│   ├── web/                 React admin SPA (Vite)
│   │   └── src/
│   │       ├── context/     AuthContext, OrgContext
│   │       ├── components/  Layout, DataTable, SlideOver, ProtectedRoute
│   │       ├── pages/       LoginPage, DashboardPage, …
│   │       └── lib/         Axios instance with refresh interceptor
│   └── mobile/              Expo React Native app
│       ├── App.tsx
│       ├── screens/         LoginScreen, ContentListScreen
│       └── components/      ContentCard
├── packages/
│   └── types/               Shared DTO interfaces (single source of truth)
├── docs/superpowers/
│   ├── specs/               Design spec
│   └── plans/               Implementation plan
├── docker-compose.yml
├── turbo.json
└── package.json             Root workspace
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | DB name | `exam` |
| `POSTGRES_USER` | DB user | `postgres` |
| `POSTGRES_PASSWORD` | DB password | `postgres` |
| `DATABASE_URL` | Prisma connection string | `postgresql://postgres:postgres@postgres:5432/exam` |
| `JWT_SECRET` | 32+ char access-token secret | dev fallback |
| `JWT_REFRESH_SECRET` | 32+ char refresh-token secret | dev fallback |
| `CORS_ORIGIN` | Comma-separated allowed origins | `http://localhost:3000,http://localhost:19006` |
| `PORT` | API listen port | `4000` |
| `EXPO_PUBLIC_API_URL` | API URL exposed to the mobile bundle | `http://localhost:4000/api` |

Copy `.env.example` to `.env` and edit as needed.

## API Reference

All routes are under `/api`. Admin routes require the `x-org-id` header naming the active organization.

### Auth
- `POST /auth/login` — body `{ email, password }`; sets `access_token` and `refresh_token` cookies, returns `{ user, accessToken }`
- `POST /auth/refresh` — rotates tokens
- `POST /auth/logout` — clears cookies
- `GET /auth/me` — returns the current user and (if `x-org-id` provided) their membership

### Organizations (auth required)
- `GET /orgs` — orgs the current user is a member of
- `POST /orgs` — creates an org and adds the creator as FULL
- `GET /orgs/:id` — single org (must be member)
- `PATCH /orgs/:id` — update (FULL only)
- `DELETE /orgs/:id` — delete (FULL only)

### Teams (nested under orgs)
- `GET /orgs/:orgId/teams`
- `POST /orgs/:orgId/teams` (FULL)
- `GET /orgs/:orgId/teams/:id`
- `PATCH /orgs/:orgId/teams/:id` (FULL)
- `DELETE /orgs/:orgId/teams/:id` (FULL)
- `POST /orgs/:orgId/teams/:id/members` (FULL) — body `{ userId }`
- `DELETE /orgs/:orgId/teams/:id/members/:userId` (FULL)

### Users
- `GET /users` — list all users (any org member can read)
- `POST /users` (FULL) — body `{ email, password, name }`
- `GET /users/:id`
- `PATCH /users/:id` (FULL)
- `DELETE /users/:id` (FULL)

### Org Memberships / Roles
- `GET /orgs/:orgId/members`
- `POST /orgs/:orgId/members` (FULL) — body `{ userId, role: READ|FULL }`
- `PATCH /orgs/:orgId/members/:userId` (FULL) — body `{ role }`
- `DELETE /orgs/:orgId/members/:userId` (FULL)

### Content
- `GET /content` — all content (any org member)
- `GET /content/:id` — single (any org member)
- `POST /content` (FULL) — body `{ title, body, status?, assignedToId }`
- `PATCH /content/:id` (FULL)
- `DELETE /content/:id` (FULL)
- `GET /content/user/:userId` — **mobile endpoint, auth only, no org context**

### Error Response Shape

```json
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }
```

Status codes: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 422 (unprocessable).

## Running Tests

```bash
# Requires a local Postgres reachable at localhost:5432
createdb exam_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exam_test \
  npx prisma db push --skip-generate --accept-data-loss --schema apps/api/prisma/schema.prisma

npm test --workspace=@admin-platform-exam/api
```

## Design Documents

- Spec: [`docs/superpowers/specs/2026-05-13-admin-platform-design.md`](docs/superpowers/specs/2026-05-13-admin-platform-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-05-13-admin-platform.md`](docs/superpowers/plans/2026-05-13-admin-platform.md)
