# Admin Platform — Design Spec

**Date:** 2026-05-13  
**Stack:** React.js · Express.js · PostgreSQL (Prisma) · Expo React Native · Turborepo · Docker Compose

---

## 1. Overview

A containerized, monorepo full-stack application with:

- **Web admin SPA** (React.js + Vite) — admin CRUD for organizations, teams, users, roles, and content
- **REST API** (Express.js + Prisma) — JWT-authenticated, role-enforced endpoints
- **PostgreSQL** — primary data store, managed by Prisma migrations
- **Mobile screen** (Expo React Native) — displays content items assigned to a specific user

All services run via `docker-compose up` with no cloud dependencies.

---

## 2. Monorepo Structure

```
exam/
├── apps/
│   ├── web/          # React.js admin SPA (Vite)
│   ├── api/          # Express.js + Prisma backend
│   └── mobile/       # Expo React Native app
├── packages/
│   └── types/        # Shared TypeScript types (DTOs, API response shapes)
├── docker-compose.yml
├── turbo.json
└── package.json      # root workspace
```

**Tooling:** Turborepo + npm workspaces. The `packages/types` package is the single source of truth for shared TypeScript interfaces — both `web` and `mobile` import from it.

**Turborepo pipeline:**
- `build` — web and mobile depend on types being built first
- `dev` — all three apps run concurrently with hot reload

---

## 3. Data Model

### Prisma Schema (entities)

```prisma
enum Role {
  READ   // view-only: all GET endpoints
  FULL   // full CRUD
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  createdAt DateTime @default(now())

  memberships UserOrganization[]
  teamMembers TeamMember[]
  content     Content[]         @relation("AssignedContent")
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  memberships UserOrganization[]
  teams       Team[]
}

model UserOrganization {
  userId         String
  organizationId String
  role           Role

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([userId, organizationId])
  @@id([userId, organizationId])
}

model Team {
  id             String   @id @default(cuid())
  name           String
  organizationId String
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  members      TeamMember[]
}

model TeamMember {
  userId String
  teamId String

  user User @relation(fields: [userId], references: [id])
  team Team @relation(fields: [teamId], references: [id])

  @@unique([userId, teamId])
  @@id([userId, teamId])
}

model Content {
  id           String        @id @default(cuid())
  title        String
  body         String
  status       ContentStatus @default(DRAFT)
  assignedToId String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  assignedTo User @relation("AssignedContent", fields: [assignedToId], references: [id])
}
```

### Key Design Decision — Approach B (Role Per Org Membership)

A user's `Role` lives on the `UserOrganization` join table, not on the `User` model. This means:

- A user can be `FULL` in Org A and `READ` in Org B
- Teams have no role — they are structural/informational groupings within an org
- The "admin" concept is any user with `FULL` role in the active org

---

## 4. API Design

**Base URL:** `http://localhost:4000/api`

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Returns JWT access token (httpOnly cookie) + refresh token |
| POST | `/auth/refresh` | Rotates refresh token |
| POST | `/auth/logout` | Clears cookies |
| GET | `/auth/me` | Returns current user + active org membership |

### Middleware Chain (protected routes)

```
requireAuth        → validates JWT from httpOnly cookie (web) OR Authorization: Bearer header
                     (mobile); attaches req.user
requireOrgMember   → verifies user belongs to x-org-id header, attaches req.membership
requireFullAccess  → asserts req.membership.role === FULL (mutating routes only)
```

Admin routes require `x-org-id`. The mobile endpoint `GET /content/user/:userId` uses only `requireAuth` — no org context required, since it returns content assigned to a user regardless of org.

### Organizations

| Method | Path | Role Required |
|--------|------|---------------|
| GET | `/orgs` | READ or FULL |
| POST | `/orgs` | FULL |
| PATCH | `/orgs/:id` | FULL |
| DELETE | `/orgs/:id` | FULL |

### Teams (org-scoped)

| Method | Path | Role Required |
|--------|------|---------------|
| GET | `/orgs/:orgId/teams` | READ or FULL |
| POST | `/orgs/:orgId/teams` | FULL |
| PATCH | `/orgs/:orgId/teams/:id` | FULL |
| DELETE | `/orgs/:orgId/teams/:id` | FULL |

### Users

| Method | Path | Role Required |
|--------|------|---------------|
| GET | `/users` | READ or FULL |
| POST | `/users` | FULL |
| PATCH | `/users/:id` | FULL |
| DELETE | `/users/:id` | FULL |

### Org Memberships / Roles

| Method | Path | Role Required |
|--------|------|---------------|
| GET | `/orgs/:orgId/members` | READ or FULL |
| POST | `/orgs/:orgId/members` | FULL |
| PATCH | `/orgs/:orgId/members/:userId` | FULL |
| DELETE | `/orgs/:orgId/members/:userId` | FULL |

### Content

| Method | Path | Role Required |
|--------|------|---------------|
| GET | `/content` | READ or FULL |
| GET | `/content/user/:userId` | READ or FULL (used by mobile) |
| POST | `/content` | FULL |
| PATCH | `/content/:id` | FULL |
| DELETE | `/content/:id` | FULL |

### Error Response Shape

```json
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }
```

HTTP status codes: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 422 (unprocessable).

---

## 5. React.js Admin Frontend

**Tech:** Vite + React 18 + React Router v6 + TanStack Query + Axios + CSS Modules

### Routes

| Path | Page | Notes |
|------|------|-------|
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | Org selector + summary cards |
| `/organizations` | OrganizationsPage | List + create |
| `/organizations/:id` | OrganizationDetailPage | Edit, manage members & teams |
| `/teams` | TeamsPage | List + create |
| `/teams/:id` | TeamDetailPage | Edit, manage members |
| `/users` | UsersPage | List + create |
| `/users/:id` | UserDetailPage | Edit, assign to org |
| `/roles` | RolesPage | List org memberships + assign/change roles |
| `/content` | ContentPage | List + create |
| `/content/:id` | ContentDetailPage | Edit, assign to user |

### State & Permission Enforcement

- `AuthContext` — stores decoded JWT payload (userId, email); refreshed on mount via `/auth/refresh`
- `OrgContext` — stores the active org; injected as `x-org-id` header on every Axios request
- `usePermission()` hook — reads `membership.role` from `/auth/me`, returns `{ canWrite: boolean }`
- Mutating UI elements (Create / Edit / Delete buttons) are hidden when `canWrite === false`
- The API enforces the same rules — UI hiding is UX polish only, not a security boundary

### Layout

Persistent left sidebar with nav links. Top bar shows active org name + logged-in user. Each resource page: data table → slide-over panel for create/edit (no separate pages for forms).

---

## 6. Expo React Native Screen

A single `ContentListScreen` that fetches and displays content assigned to a specific user.

**Data source:** `GET /api/content/user/:userId`  
**Auth:** JWT stored in `expo-secure-store`, sent as `Authorization: Bearer <token>` header

### Screen Flow

1. Minimal login screen — email + password fields → calls `/auth/login` → stores token
2. `ContentListScreen` — fetches content for the logged-in user's ID
3. `ContentCard` component — title, body preview (2 lines), status badge, formatted date

### States

- **Loading** — `ActivityIndicator` centered
- **Empty** — "No content assigned" message
- **Error** — error message + retry button
- **Data** — `FlatList` of `ContentCard` components

---

## 7. Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: pg_isready

  api:
    build: ./apps/api
    depends_on: { postgres: { condition: service_healthy } }
    ports: ["4000:4000"]
    environment:
      DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT=4000
    command: prisma migrate deploy && prisma db seed && node dist/index.js

  web:
    build: ./apps/web  # node build stage → nginx serve
    depends_on: [api]
    ports: ["3000:80"]

  mobile:
    build: ./apps/mobile  # Expo CLI dev server
    ports: ["8081:8081", "19000:19000"]
    environment: EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

### Seed Data (auto-applied on first boot)

- 1 superadmin: `admin@example.com` / `password` with `FULL` role in both orgs
- 2 organizations, 2 teams
- 3 additional users: 2 with `READ`, 1 with `FULL`
- 5 content items distributed across users

---

## 8. README

A root-level `README.md` covering:

- **Project overview** — what the app does, who it's for
- **Architecture diagram** (ASCII) — showing the four Docker services and how they relate
- **Prerequisites** — Docker + Docker Compose (only requirement to run)
- **Quick start** — `docker-compose up --build` and where to open each service
  - Web admin: `http://localhost:3000`
  - API: `http://localhost:4000`
  - Mobile (Expo): `http://localhost:8081`
- **Default credentials** — seeded superadmin email + password
- **Local development** — how to run outside Docker with `turbo dev`
- **Project structure** — annotated directory tree
- **Environment variables** — table of all vars with descriptions and defaults
- **API reference** — link to the spec or inline summary of key endpoints

---

## 9. Project Constraints

- No cloud services — fully self-contained via Docker Compose
- Single `docker-compose up` must boot the entire stack
- Prisma migrations run automatically on API container start
- TypeScript throughout (strict mode)
- Shared types package eliminates client/server type drift
