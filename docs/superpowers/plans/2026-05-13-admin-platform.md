# Admin Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a containerized monorepo admin platform — Express REST API + PostgreSQL (Prisma), React.js admin SPA, and an Expo React Native content screen — all bootable via `docker-compose up`.

**Architecture:** Turborepo + npm workspaces with three apps (`api`, `web`, `mobile`) and one `packages/types` package. The API enforces JWT auth and role-per-org-membership permissions (READ | FULL). Single `docker-compose up` boots postgres, api, web, and mobile.

**Tech Stack:** TypeScript 5 strict · Express 4 · Prisma 5 · PostgreSQL 16 · React 18 + Vite 5 · TanStack Query 5 · React Router 6 · Expo SDK 51 · Jest + Supertest · Turborepo 2 · Docker Compose

---

## File Map

### packages/types
- `src/index.ts` — shared DTO interfaces and enum string types

### apps/api
- `prisma/schema.prisma` — Prisma schema
- `prisma/seed.ts` — seed script
- `src/index.ts` — HTTP server bootstrap
- `src/app.ts` — Express app factory
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/jwt.ts` — JWT sign/verify
- `src/types/express.d.ts` — Express Request augmentation
- `src/middleware/requireAuth.ts`
- `src/middleware/requireOrgMember.ts`
- `src/middleware/requireFullAccess.ts`
- `src/routes/auth.routes.ts` + `src/controllers/auth.controller.ts`
- `src/routes/orgs.routes.ts` + `src/controllers/orgs.controller.ts`
- `src/routes/teams.routes.ts` + `src/controllers/teams.controller.ts`
- `src/routes/users.routes.ts` + `src/controllers/users.controller.ts`
- `src/routes/members.routes.ts` + `src/controllers/members.controller.ts`
- `src/routes/content.routes.ts` + `src/controllers/content.controller.ts`
- `tests/auth.test.ts`, `tests/content.test.ts`, `tests/setup.ts`

### apps/web
- `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`
- `src/lib/axios.ts` — Axios instance
- `src/context/AuthContext.tsx`, `src/context/OrgContext.tsx`
- `src/hooks/usePermission.ts`
- `src/components/Layout.tsx`, `ProtectedRoute.tsx`, `DataTable.tsx`, `SlideOver.tsx`
- `src/pages/LoginPage.tsx`, `DashboardPage.tsx`, `OrganizationsPage.tsx`, `TeamsPage.tsx`, `UsersPage.tsx`, `RolesPage.tsx`, `ContentPage.tsx`
- `src/styles/globals.css`

### apps/mobile
- `App.tsx`, `screens/LoginScreen.tsx`, `screens/ContentListScreen.tsx`
- `components/ContentCard.tsx`
- `lib/storage.ts`, `lib/api.ts`

### Infrastructure
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, `apps/mobile/Dockerfile`
- `docker-compose.yml`, `.env.example`, `README.md`

---

## Task 1: Monorepo Scaffold + Shared Types Package

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Initialize root package.json**

Create `package.json`:
```json
{
  "name": "exam",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create turbo.json**

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".vite/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 3: Create base tsconfig**

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "moduleResolution": "node"
  }
}
```

- [ ] **Step 4: Create .gitignore**

Create `.gitignore`:
```
node_modules
dist
.turbo
.env
.env.local
*.log
.DS_Store
postgres_data
.expo
```

- [ ] **Step 5: Create .env.example**

Create `.env.example`:
```
POSTGRES_DB=exam
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/exam
JWT_SECRET=replace-with-32-char-min-secret-key
JWT_REFRESH_SECRET=replace-with-32-char-min-refresh-key
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 6: Create packages/types/package.json**

Create `packages/types/package.json`:
```json
{
  "name": "@exam/types",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Create packages/types/tsconfig.json**

Create `packages/types/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 8: Create shared types**

Create `packages/types/src/index.ts`:
```typescript
export type Role = 'READ' | 'FULL';
export type ContentStatus = 'DRAFT' | 'PUBLISHED';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  createdAt: string;
}

export interface TeamDTO {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export interface UserOrganizationDTO {
  userId: string;
  organizationId: string;
  role: Role;
  user?: UserDTO;
  organization?: OrganizationDTO;
}

export interface TeamMemberDTO {
  userId: string;
  teamId: string;
  user?: UserDTO;
}

export interface ContentDTO {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  assignedToId: string;
  assignedTo?: UserDTO;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
}

export interface AuthMeResponse {
  user: UserDTO;
  membership: UserOrganizationDTO | null;
}

export interface CreateOrgRequest { name: string; }
export interface UpdateOrgRequest { name: string; }

export interface CreateTeamRequest { name: string; }
export interface UpdateTeamRequest { name: string; }

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
}

export interface AddMemberRequest { userId: string; role: Role; }
export interface UpdateMemberRequest { role: Role; }

export interface CreateContentRequest {
  title: string;
  body: string;
  status?: ContentStatus;
  assignedToId: string;
}
export interface UpdateContentRequest {
  title?: string;
  body?: string;
  status?: ContentStatus;
  assignedToId?: string;
}

export interface ApiError {
  error: string;
  code: string;
}
```

- [ ] **Step 9: Install workspace dependencies**

Run: `npm install`
Expected: `node_modules` directory created at root; workspace symlinks established.

- [ ] **Step 10: Commit**

```bash
git add package.json turbo.json tsconfig.base.json .gitignore .env.example packages/
git commit -m "chore: scaffold monorepo with Turborepo and shared types package"
```

---

## Task 2: API Prisma Schema + Seed Script

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Create API package.json**

Create `apps/api/package.json`:
```json
{
  "name": "@exam/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "prisma generate && tsc",
    "start": "node dist/src/index.js",
    "test": "jest --runInBand --forceExit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "clean": "rm -rf dist"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@exam/types": "*",
    "@prisma/client": "^5.18.0",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.18.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create API tsconfig.json**

Create `apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*", "prisma/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create Prisma schema**

Create `apps/api/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  READ
  FULL
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())

  memberships UserOrganization[]
  teamMembers TeamMember[]
  content     Content[]          @relation("AssignedContent")
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

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@id([userId, organizationId])
}

model Team {
  id             String   @id @default(cuid())
  name           String
  organizationId String
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  members      TeamMember[]
}

model TeamMember {
  userId String
  teamId String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

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

  assignedTo User @relation("AssignedContent", fields: [assignedToId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 4: Create seed script**

Create `apps/api/prisma/seed.ts`:
```typescript
import { PrismaClient, Role, ContentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: passwordHash, name: 'Super Admin' },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', password: passwordHash, name: 'Alice Smith' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', password: passwordHash, name: 'Bob Jones' },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: { email: 'carol@example.com', password: passwordHash, name: 'Carol White' },
  });

  const orgAlpha = await prisma.organization.upsert({
    where: { id: 'seed-org-alpha' },
    update: {},
    create: { id: 'seed-org-alpha', name: 'Alpha Corp' },
  });

  const orgBeta = await prisma.organization.upsert({
    where: { id: 'seed-org-beta' },
    update: {},
    create: { id: 'seed-org-beta', name: 'Beta Inc' },
  });

  const teamDev = await prisma.team.upsert({
    where: { id: 'seed-team-dev' },
    update: {},
    create: { id: 'seed-team-dev', name: 'Development', organizationId: orgAlpha.id },
  });

  const teamDesign = await prisma.team.upsert({
    where: { id: 'seed-team-design' },
    update: {},
    create: { id: 'seed-team-design', name: 'Design', organizationId: orgBeta.id },
  });

  const memberships = [
    { userId: admin.id, organizationId: orgAlpha.id, role: Role.FULL },
    { userId: admin.id, organizationId: orgBeta.id, role: Role.FULL },
    { userId: alice.id, organizationId: orgAlpha.id, role: Role.FULL },
    { userId: bob.id, organizationId: orgAlpha.id, role: Role.READ },
    { userId: carol.id, organizationId: orgBeta.id, role: Role.READ },
  ];
  for (const m of memberships) {
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: m.userId, organizationId: m.organizationId } },
      update: { role: m.role },
      create: m,
    });
  }

  const teamMembers = [
    { userId: alice.id, teamId: teamDev.id },
    { userId: bob.id, teamId: teamDev.id },
    { userId: carol.id, teamId: teamDesign.id },
  ];
  for (const tm of teamMembers) {
    await prisma.teamMember.upsert({
      where: { userId_teamId: tm },
      update: {},
      create: tm,
    });
  }

  const existingContent = await prisma.content.count();
  if (existingContent === 0) {
    await prisma.content.createMany({
      data: [
        { title: 'Getting Started Guide', body: 'Welcome to the platform. This guide walks you through your first steps.', status: ContentStatus.PUBLISHED, assignedToId: alice.id },
        { title: 'API Documentation Draft', body: 'Our REST API exposes endpoints for orgs, teams, users, and content.', status: ContentStatus.DRAFT, assignedToId: alice.id },
        { title: 'Q2 Release Notes', body: 'New features in Q2: role-based access, audit logs, mobile preview.', status: ContentStatus.PUBLISHED, assignedToId: bob.id },
        { title: 'Team Handbook', body: 'How we work, what we value, and how we collaborate across teams.', status: ContentStatus.PUBLISHED, assignedToId: bob.id },
        { title: 'Design System v1', body: 'Tokens, components, and patterns for the upcoming product redesign.', status: ContentStatus.DRAFT, assignedToId: carol.id },
      ],
    });
  }

  console.log('Seed complete:');
  console.log('  Users:', await prisma.user.count());
  console.log('  Orgs:', await prisma.organization.count());
  console.log('  Teams:', await prisma.team.count());
  console.log('  Memberships:', await prisma.userOrganization.count());
  console.log('  Content:', await prisma.content.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Install API dependencies**

Run: `npm install --workspace=@exam/api`
Expected: API dependencies installed.

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json apps/api/prisma/
git commit -m "feat(api): add Prisma schema and seed script"
```

---

## Task 3: API Express Foundation

**Files:**
- Create: `apps/api/src/types/express.d.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/jwt.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`

- [ ] **Step 1: Augment Express Request type**

Create `apps/api/src/types/express.d.ts`:
```typescript
import { UserOrganization, Organization } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      membership?: UserOrganization & { organization: Organization };
    }
  }
}

export {};
```

- [ ] **Step 2: Create Prisma singleton**

Create `apps/api/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

- [ ] **Step 3: Create JWT helpers**

Create `apps/api/src/lib/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

export interface TokenPayload {
  id: string;
}

export const signAccessToken = (userId: string): string =>
  jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '15m' });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};
```

- [ ] **Step 4: Create Express app factory**

Create `apps/api/src/app.ts`:
```typescript
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Routes mounted in later tasks
  // app.use('/api/auth', authRouter);
  // app.use('/api/orgs', orgsRouter);
  // app.use('/api/users', usersRouter);
  // app.use('/api/content', contentRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
};
```

- [ ] **Step 5: Create server bootstrap**

Create `apps/api/src/index.ts`:
```typescript
import { createApp } from './app';

const port = parseInt(process.env.PORT || '4000', 10);
const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
```

- [ ] **Step 6: Verify build compiles**

Run: `npm run build --workspace=@exam/api`
Expected: PASS — `dist/` directory created with compiled JS, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add Express app factory, JWT helpers, and Prisma client"
```

---

## Task 4: API Authentication Middleware

**Files:**
- Create: `apps/api/src/middleware/requireAuth.ts`
- Create: `apps/api/src/middleware/requireOrgMember.ts`
- Create: `apps/api/src/middleware/requireFullAccess.ts`

- [ ] **Step 1: Create requireAuth middleware**

Create `apps/api/src/middleware/requireAuth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.access_token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }

  req.user = payload;
  next();
};
```

- [ ] **Step 2: Create requireOrgMember middleware**

Create `apps/api/src/middleware/requireOrgMember.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const requireOrgMember = async (req: Request, res: Response, next: NextFunction) => {
  const orgId = (req.headers['x-org-id'] as string) || req.params.orgId;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization context required (x-org-id header)', code: 'ORG_REQUIRED' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: req.user.id, organizationId: orgId } },
    include: { organization: true },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this organization', code: 'NOT_ORG_MEMBER' });
  }

  req.membership = membership;
  next();
};
```

- [ ] **Step 3: Create requireFullAccess middleware**

Create `apps/api/src/middleware/requireFullAccess.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export const requireFullAccess = (req: Request, res: Response, next: NextFunction) => {
  if (req.membership?.role !== 'FULL') {
    return res.status(403).json({ error: 'Full access required for this operation', code: 'FORBIDDEN' });
  }
  next();
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/middleware/
git commit -m "feat(api): add auth, org membership, and role middleware"
```

---

## Task 5: API Auth Routes (login / refresh / logout / me)

**Files:**
- Create: `apps/api/src/controllers/auth.controller.ts`
- Create: `apps/api/src/routes/auth.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create auth controller**

Create `apps/api/src/controllers/auth.controller.ts`:
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const toUserDTO = (u: { id: string; email: string; name: string; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  createdAt: u.createdAt.toISOString(),
});

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const access = signAccessToken(user.id);
  const refresh = signRefreshToken(user.id);
  res.cookie('access_token', access, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE });
  res.cookie('refresh_token', refresh, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE });

  res.json({ user: toUserDTO(user), accessToken: access });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token || (req.body?.refreshToken as string | undefined);
  if (!token) {
    return res.status(401).json({ error: 'Refresh token required', code: 'UNAUTHENTICATED' });
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists', code: 'INVALID_TOKEN' });
  }

  const access = signAccessToken(user.id);
  const newRefresh = signRefreshToken(user.id);
  res.cookie('access_token', access, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE });
  res.cookie('refresh_token', newRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE });

  res.json({ user: toUserDTO(user), accessToken: access });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('access_token', COOKIE_OPTS);
  res.clearCookie('refresh_token', COOKIE_OPTS);
  res.json({ message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  const orgId = req.headers['x-org-id'] as string | undefined;
  let membership = null;
  if (orgId) {
    membership = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
      include: { organization: true },
    });
  }

  res.json({
    user: toUserDTO(user),
    membership: membership
      ? {
          userId: membership.userId,
          organizationId: membership.organizationId,
          role: membership.role,
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            createdAt: membership.organization.createdAt.toISOString(),
          },
        }
      : null,
  });
};
```

- [ ] **Step 2: Create auth router**

Create `apps/api/src/routes/auth.routes.ts`:
```typescript
import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
```

- [ ] **Step 3: Mount auth router in app**

Modify `apps/api/src/app.ts`. Replace the commented routes block with:
```typescript
import { authRouter } from './routes/auth.routes';
// ... above imports stay the same
```

And in the function body, replace the `// Routes mounted in later tasks` block:
```typescript
  app.use('/api/auth', authRouter);
  // app.use('/api/orgs', orgsRouter);
  // app.use('/api/users', usersRouter);
  // app.use('/api/content', contentRouter);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS — no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add auth routes (login, refresh, logout, me)"
```

---

## Task 6: API Organizations Routes

**Files:**
- Create: `apps/api/src/controllers/orgs.controller.ts`
- Create: `apps/api/src/routes/orgs.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create orgs controller**

Create `apps/api/src/controllers/orgs.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const toOrgDTO = (o: { id: string; name: string; createdAt: Date }) => ({
  id: o.id,
  name: o.name,
  createdAt: o.createdAt.toISOString(),
});

export const listOrgs = async (req: Request, res: Response) => {
  const orgs = await prisma.organization.findMany({
    where: { memberships: { some: { userId: req.user!.id } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orgs.map(toOrgDTO));
};

export const getOrg = async (req: Request, res: Response) => {
  const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
  if (!org) {
    return res.status(404).json({ error: 'Organization not found', code: 'NOT_FOUND' });
  }
  res.json(toOrgDTO(org));
};

export const createOrg = async (req: Request, res: Response) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
  }

  const org = await prisma.organization.create({ data: { name } });
  await prisma.userOrganization.create({
    data: { userId: req.user!.id, organizationId: org.id, role: 'FULL' },
  });

  res.status(201).json(toOrgDTO(org));
};

export const updateOrg = async (req: Request, res: Response) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
  }

  try {
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: { name },
    });
    res.json(toOrgDTO(org));
  } catch {
    res.status(404).json({ error: 'Organization not found', code: 'NOT_FOUND' });
  }
};

export const deleteOrg = async (req: Request, res: Response) => {
  try {
    await prisma.organization.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Organization not found', code: 'NOT_FOUND' });
  }
};
```

- [ ] **Step 2: Create orgs router**

Create `apps/api/src/routes/orgs.routes.ts`:
```typescript
import { Router } from 'express';
import { listOrgs, getOrg, createOrg, updateOrg, deleteOrg } from '../controllers/orgs.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireOrgMember } from '../middleware/requireOrgMember';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const orgsRouter = Router();

orgsRouter.use(requireAuth);

orgsRouter.get('/', listOrgs);
orgsRouter.post('/', createOrg);

orgsRouter.get('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, getOrg);
orgsRouter.patch('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, requireFullAccess, updateOrg);
orgsRouter.delete('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, requireFullAccess, deleteOrg);
```

- [ ] **Step 3: Mount orgs router in app**

Modify `apps/api/src/app.ts`. Add the import at the top of the file alongside the existing `authRouter` import:
```typescript
import { orgsRouter } from './routes/orgs.routes';
```

And replace the orgs-router placeholder line with the active mount:
```typescript
  app.use('/api/orgs', orgsRouter);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add organizations CRUD routes"
```

---

## Task 7: API Teams Routes (nested under orgs)

**Files:**
- Create: `apps/api/src/controllers/teams.controller.ts`
- Create: `apps/api/src/routes/teams.routes.ts`
- Modify: `apps/api/src/routes/orgs.routes.ts`

- [ ] **Step 1: Create teams controller**

Create `apps/api/src/controllers/teams.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const toTeamDTO = (t: { id: string; name: string; organizationId: string; createdAt: Date }) => ({
  id: t.id,
  name: t.name,
  organizationId: t.organizationId,
  createdAt: t.createdAt.toISOString(),
});

export const listTeams = async (req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    where: { organizationId: req.params.orgId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(teams.map(toTeamDTO));
};

export const getTeam = async (req: Request, res: Response) => {
  const team = await prisma.team.findFirst({
    where: { id: req.params.id, organizationId: req.params.orgId },
    include: { members: { include: { user: true } } },
  });
  if (!team) {
    return res.status(404).json({ error: 'Team not found', code: 'NOT_FOUND' });
  }
  res.json({
    ...toTeamDTO(team),
    members: team.members.map((m) => ({
      userId: m.userId,
      teamId: m.teamId,
      user: { id: m.user.id, email: m.user.email, name: m.user.name, createdAt: m.user.createdAt.toISOString() },
    })),
  });
};

export const createTeam = async (req: Request, res: Response) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
  }

  const team = await prisma.team.create({
    data: { name, organizationId: req.params.orgId },
  });
  res.status(201).json(toTeamDTO(team));
};

export const updateTeam = async (req: Request, res: Response) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
  }

  const existing = await prisma.team.findFirst({
    where: { id: req.params.id, organizationId: req.params.orgId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Team not found', code: 'NOT_FOUND' });
  }

  const team = await prisma.team.update({ where: { id: req.params.id }, data: { name } });
  res.json(toTeamDTO(team));
};

export const deleteTeam = async (req: Request, res: Response) => {
  const existing = await prisma.team.findFirst({
    where: { id: req.params.id, organizationId: req.params.orgId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Team not found', code: 'NOT_FOUND' });
  }
  await prisma.team.delete({ where: { id: req.params.id } });
  res.status(204).end();
};

export const addTeamMember = async (req: Request, res: Response) => {
  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required', code: 'VALIDATION_ERROR' });
  }

  const team = await prisma.team.findFirst({
    where: { id: req.params.id, organizationId: req.params.orgId },
  });
  if (!team) {
    return res.status(404).json({ error: 'Team not found', code: 'NOT_FOUND' });
  }

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId, teamId: team.id } },
    update: {},
    create: { userId, teamId: team.id },
  });
  res.status(201).json({ userId, teamId: team.id });
};

export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    await prisma.teamMember.delete({
      where: { userId_teamId: { userId: req.params.userId, teamId: req.params.id } },
    });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Team member not found', code: 'NOT_FOUND' });
  }
};
```

- [ ] **Step 2: Create teams router**

Create `apps/api/src/routes/teams.routes.ts`:
```typescript
import { Router } from 'express';
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/teams.controller';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const teamsRouter = Router({ mergeParams: true });

teamsRouter.get('/', listTeams);
teamsRouter.get('/:id', getTeam);
teamsRouter.post('/', requireFullAccess, createTeam);
teamsRouter.patch('/:id', requireFullAccess, updateTeam);
teamsRouter.delete('/:id', requireFullAccess, deleteTeam);
teamsRouter.post('/:id/members', requireFullAccess, addTeamMember);
teamsRouter.delete('/:id/members/:userId', requireFullAccess, removeTeamMember);
```

- [ ] **Step 3: Nest teams router under orgs**

Modify `apps/api/src/routes/orgs.routes.ts`. Add import:
```typescript
import { teamsRouter } from './teams.routes';
```

After the `orgsRouter.use(requireAuth);` line, add this mount (above the route definitions):
```typescript
orgsRouter.use('/:orgId/teams',
  (req, _res, next) => { req.headers['x-org-id'] = req.params.orgId; next(); },
  requireOrgMember,
  teamsRouter,
);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add teams CRUD routes nested under organizations"
```

---

## Task 8: API Users Routes

**Files:**
- Create: `apps/api/src/controllers/users.controller.ts`
- Create: `apps/api/src/routes/users.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create users controller**

Create `apps/api/src/controllers/users.controller.ts`:
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const toUserDTO = (u: { id: string; email: string; name: string; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  createdAt: u.createdAt.toISOString(),
});

export const listUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(toUserDTO));
};

export const getUser = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }
  res.json({
    ...toUserDTO(user),
    memberships: user.memberships.map((m) => ({
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      organization: {
        id: m.organization.id,
        name: m.organization.name,
        createdAt: m.organization.createdAt.toISOString(),
      },
    })),
  });
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required', code: 'VALIDATION_ERROR' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(422).json({ error: 'Email already in use', code: 'EMAIL_TAKEN' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });
  res.status(201).json(toUserDTO(user));
};

export const updateUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};
  const data: { email?: string; password?: string; name?: string } = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (password !== undefined) data.password = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(toUserDTO(user));
  } catch {
    res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }
};
```

- [ ] **Step 2: Create users router**

Create `apps/api/src/routes/users.routes.ts`:
```typescript
import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireOrgMember } from '../middleware/requireOrgMember';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.use(requireOrgMember);

usersRouter.get('/', listUsers);
usersRouter.get('/:id', getUser);
usersRouter.post('/', requireFullAccess, createUser);
usersRouter.patch('/:id', requireFullAccess, updateUser);
usersRouter.delete('/:id', requireFullAccess, deleteUser);
```

- [ ] **Step 3: Mount users router in app**

Modify `apps/api/src/app.ts`. Add import next to the other router imports:
```typescript
import { usersRouter } from './routes/users.routes';
```

Replace the users-router placeholder with the active mount:
```typescript
  app.use('/api/users', usersRouter);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add users CRUD routes"
```

---

## Task 9: API Org Membership / Roles Routes

**Files:**
- Create: `apps/api/src/controllers/members.controller.ts`
- Create: `apps/api/src/routes/members.routes.ts`
- Modify: `apps/api/src/routes/orgs.routes.ts`

- [ ] **Step 1: Create members controller**

Create `apps/api/src/controllers/members.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const toMemberDTO = (m: {
  userId: string;
  organizationId: string;
  role: 'READ' | 'FULL';
  user: { id: string; email: string; name: string; createdAt: Date };
}) => ({
  userId: m.userId,
  organizationId: m.organizationId,
  role: m.role,
  user: {
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
    createdAt: m.user.createdAt.toISOString(),
  },
});

export const listMembers = async (req: Request, res: Response) => {
  const members = await prisma.userOrganization.findMany({
    where: { organizationId: req.params.orgId },
    include: { user: true },
  });
  res.json(members.map(toMemberDTO));
};

export const addMember = async (req: Request, res: Response) => {
  const { userId, role } = req.body ?? {};
  if (!userId || !role || (role !== 'READ' && role !== 'FULL')) {
    return res.status(400).json({ error: 'userId and role (READ|FULL) are required', code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  const existing = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId: req.params.orgId } },
  });
  if (existing) {
    return res.status(422).json({ error: 'User is already a member of this organization', code: 'ALREADY_MEMBER' });
  }

  const member = await prisma.userOrganization.create({
    data: { userId, organizationId: req.params.orgId, role },
    include: { user: true },
  });
  res.status(201).json(toMemberDTO(member));
};

export const updateMember = async (req: Request, res: Response) => {
  const { role } = req.body ?? {};
  if (!role || (role !== 'READ' && role !== 'FULL')) {
    return res.status(400).json({ error: 'role (READ|FULL) is required', code: 'VALIDATION_ERROR' });
  }

  try {
    const member = await prisma.userOrganization.update({
      where: { userId_organizationId: { userId: req.params.userId, organizationId: req.params.orgId } },
      data: { role },
      include: { user: true },
    });
    res.json(toMemberDTO(member));
  } catch {
    res.status(404).json({ error: 'Membership not found', code: 'NOT_FOUND' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    await prisma.userOrganization.delete({
      where: { userId_organizationId: { userId: req.params.userId, organizationId: req.params.orgId } },
    });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Membership not found', code: 'NOT_FOUND' });
  }
};
```

- [ ] **Step 2: Create members router**

Create `apps/api/src/routes/members.routes.ts`:
```typescript
import { Router } from 'express';
import { listMembers, addMember, updateMember, removeMember } from '../controllers/members.controller';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const membersRouter = Router({ mergeParams: true });

membersRouter.get('/', listMembers);
membersRouter.post('/', requireFullAccess, addMember);
membersRouter.patch('/:userId', requireFullAccess, updateMember);
membersRouter.delete('/:userId', requireFullAccess, removeMember);
```

- [ ] **Step 3: Nest members router under orgs**

Modify `apps/api/src/routes/orgs.routes.ts`. Add import alongside `teamsRouter`:
```typescript
import { membersRouter } from './members.routes';
```

Below the existing teams mount, add the members mount:
```typescript
orgsRouter.use('/:orgId/members',
  (req, _res, next) => { req.headers['x-org-id'] = req.params.orgId; next(); },
  requireOrgMember,
  membersRouter,
);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add org membership/roles routes"
```

---

## Task 10: API Content Routes

**Files:**
- Create: `apps/api/src/controllers/content.controller.ts`
- Create: `apps/api/src/routes/content.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create content controller**

Create `apps/api/src/controllers/content.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const toContentDTO = (c: {
  id: string;
  title: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED';
  assignedToId: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: { id: string; email: string; name: string; createdAt: Date } | null;
}) => ({
  id: c.id,
  title: c.title,
  body: c.body,
  status: c.status,
  assignedToId: c.assignedToId,
  assignedTo: c.assignedTo
    ? {
        id: c.assignedTo.id,
        email: c.assignedTo.email,
        name: c.assignedTo.name,
        createdAt: c.assignedTo.createdAt.toISOString(),
      }
    : undefined,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export const listContent = async (_req: Request, res: Response) => {
  const items = await prisma.content.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { assignedTo: true },
  });
  res.json(items.map(toContentDTO));
};

export const getContent = async (req: Request, res: Response) => {
  const item = await prisma.content.findUnique({
    where: { id: req.params.id },
    include: { assignedTo: true },
  });
  if (!item) {
    return res.status(404).json({ error: 'Content not found', code: 'NOT_FOUND' });
  }
  res.json(toContentDTO(item));
};

export const listContentByUser = async (req: Request, res: Response) => {
  const items = await prisma.content.findMany({
    where: { assignedToId: req.params.userId },
    orderBy: { updatedAt: 'desc' },
    include: { assignedTo: true },
  });
  res.json(items.map(toContentDTO));
};

export const createContent = async (req: Request, res: Response) => {
  const { title, body, status, assignedToId } = req.body ?? {};
  if (!title || !body || !assignedToId) {
    return res.status(400).json({ error: 'title, body, and assignedToId are required', code: 'VALIDATION_ERROR' });
  }
  if (status && status !== 'DRAFT' && status !== 'PUBLISHED') {
    return res.status(400).json({ error: 'status must be DRAFT or PUBLISHED', code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { id: assignedToId } });
  if (!user) {
    return res.status(422).json({ error: 'Assigned user does not exist', code: 'INVALID_ASSIGNEE' });
  }

  const item = await prisma.content.create({
    data: { title, body, status: status ?? 'DRAFT', assignedToId },
    include: { assignedTo: true },
  });
  res.status(201).json(toContentDTO(item));
};

export const updateContent = async (req: Request, res: Response) => {
  const { title, body, status, assignedToId } = req.body ?? {};
  const data: { title?: string; body?: string; status?: 'DRAFT' | 'PUBLISHED'; assignedToId?: string } = {};
  if (title !== undefined) data.title = title;
  if (body !== undefined) data.body = body;
  if (status !== undefined) {
    if (status !== 'DRAFT' && status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'status must be DRAFT or PUBLISHED', code: 'VALIDATION_ERROR' });
    }
    data.status = status;
  }
  if (assignedToId !== undefined) {
    const user = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) {
      return res.status(422).json({ error: 'Assigned user does not exist', code: 'INVALID_ASSIGNEE' });
    }
    data.assignedToId = assignedToId;
  }

  try {
    const item = await prisma.content.update({
      where: { id: req.params.id },
      data,
      include: { assignedTo: true },
    });
    res.json(toContentDTO(item));
  } catch {
    res.status(404).json({ error: 'Content not found', code: 'NOT_FOUND' });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    await prisma.content.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Content not found', code: 'NOT_FOUND' });
  }
};
```

- [ ] **Step 2: Create content router**

Create `apps/api/src/routes/content.routes.ts`:
```typescript
import { Router } from 'express';
import {
  listContent,
  getContent,
  listContentByUser,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireOrgMember } from '../middleware/requireOrgMember';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const contentRouter = Router();

// Mobile-facing endpoint: requires auth only, no org context
contentRouter.get('/user/:userId', requireAuth, listContentByUser);

// Admin endpoints: require auth + org membership
contentRouter.use(requireAuth, requireOrgMember);
contentRouter.get('/', listContent);
contentRouter.get('/:id', getContent);
contentRouter.post('/', requireFullAccess, createContent);
contentRouter.patch('/:id', requireFullAccess, updateContent);
contentRouter.delete('/:id', requireFullAccess, deleteContent);
```

- [ ] **Step 3: Mount content router in app**

Modify `apps/api/src/app.ts`. Add import alongside the other router imports:
```typescript
import { contentRouter } from './routes/content.routes';
```

Replace the content-router placeholder with the active mount:
```typescript
  app.use('/api/content', contentRouter);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@exam/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add content CRUD routes including user-scoped read"
```

---

## Task 11: API Integration Tests

**Files:**
- Create: `apps/api/jest.config.js`
- Create: `apps/api/.env.test`
- Create: `apps/api/tests/setup.ts`
- Create: `apps/api/tests/auth.test.ts`
- Create: `apps/api/tests/content.test.ts`

**Prerequisites:** The engineer must have PostgreSQL running locally and create a test database before running tests:
```bash
createdb exam_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exam_test \
  npx prisma db push --skip-generate --accept-data-loss --schema apps/api/prisma/schema.prisma
```

- [ ] **Step 1: Create jest config**

Create `apps/api/jest.config.js`:
```javascript
require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEach: [],
  testTimeout: 15000,
};
```

Note: Add `dotenv` to the API's devDependencies if not present — run `npm install --workspace=@exam/api --save-dev dotenv`.

- [ ] **Step 2: Create test env file**

Create `apps/api/.env.test`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exam_test
JWT_SECRET=test-jwt-secret-32-chars-minimum-len
JWT_REFRESH_SECRET=test-refresh-secret-32-chars-min-ln
NODE_ENV=test
```

- [ ] **Step 3: Create test setup helper**

Create `apps/api/tests/setup.ts`:
```typescript
import { prisma } from '../src/lib/prisma';

export const resetDatabase = async () => {
  await prisma.content.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnect = async () => {
  await prisma.$disconnect();
};
```

- [ ] **Step 4: Write auth integration tests**

Create `apps/api/tests/auth.test.ts`:
```typescript
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, disconnect } from './setup';

const app = createApp();

let orgId: string;

beforeAll(async () => {
  await resetDatabase();

  const hash = await bcrypt.hash('password', 10);
  const org = await prisma.organization.create({ data: { name: 'Test Org' } });
  orgId = org.id;
  const user = await prisma.user.create({
    data: { email: 'admin@test.com', password: hash, name: 'Test Admin' },
  });
  await prisma.userOrganization.create({
    data: { userId: user.id, organizationId: org.id, role: 'FULL' },
  });
});

afterAll(async () => {
  await disconnect();
});

describe('POST /api/auth/login', () => {
  it('returns 200 and sets cookies for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
    expect((res.headers['set-cookie'] as unknown as string[]).some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('returns 401 for invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password' });

    expect(res.status).toBe(401);
  });

  it('returns 400 if email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user and membership with valid cookie + x-org-id', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .set('x-org-id', orgId);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('admin@test.com');
    expect(meRes.body.membership.role).toBe('FULL');
  });

  it('accepts Authorization Bearer header (mobile flow)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    const accessToken = loginRes.body.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('admin@test.com');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookies', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
  });
});
```

- [ ] **Step 5: Write content + RBAC integration tests**

Create `apps/api/tests/content.test.ts`:
```typescript
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, disconnect } from './setup';

const app = createApp();

let orgId: string;
let fullUserId: string;
let readUserId: string;
let contentId: string;
let fullCookie: string[];
let readCookie: string[];

beforeAll(async () => {
  await resetDatabase();

  const hash = await bcrypt.hash('password', 10);
  const org = await prisma.organization.create({ data: { name: 'Content Test Org' } });
  orgId = org.id;

  const fullUser = await prisma.user.create({
    data: { email: 'full@test.com', password: hash, name: 'Full User' },
  });
  fullUserId = fullUser.id;

  const readUser = await prisma.user.create({
    data: { email: 'read@test.com', password: hash, name: 'Read User' },
  });
  readUserId = readUser.id;

  await prisma.userOrganization.createMany({
    data: [
      { userId: fullUserId, organizationId: orgId, role: 'FULL' },
      { userId: readUserId, organizationId: orgId, role: 'READ' },
    ],
  });

  const content = await prisma.content.create({
    data: { title: 'Existing Post', body: 'Existing body', status: 'PUBLISHED', assignedToId: readUserId },
  });
  contentId = content.id;

  const fullLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'full@test.com', password: 'password' });
  fullCookie = fullLogin.headers['set-cookie'] as unknown as string[];

  const readLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'read@test.com', password: 'password' });
  readCookie = readLogin.headers['set-cookie'] as unknown as string[];
});

afterAll(async () => {
  await disconnect();
});

describe('GET /api/content', () => {
  it('returns content for READ role members', async () => {
    const res = await request(app)
      .get('/api/content')
      .set('Cookie', readCookie)
      .set('x-org-id', orgId);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/content').set('x-org-id', orgId);
    expect(res.status).toBe(401);
  });

  it('returns 400 without x-org-id', async () => {
    const res = await request(app).get('/api/content').set('Cookie', readCookie);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ORG_REQUIRED');
  });
});

describe('GET /api/content/user/:userId', () => {
  it('returns content assigned to a user (no org context required)', async () => {
    const res = await request(app)
      .get(`/api/content/user/${readUserId}`)
      .set('Cookie', readCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].assignedToId).toBe(readUserId);
  });
});

describe('POST /api/content', () => {
  it('forbids READ role from creating content', async () => {
    const res = await request(app)
      .post('/api/content')
      .set('Cookie', readCookie)
      .set('x-org-id', orgId)
      .send({ title: 'New', body: 'Body', assignedToId: readUserId });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('allows FULL role to create content', async () => {
    const res = await request(app)
      .post('/api/content')
      .set('Cookie', fullCookie)
      .set('x-org-id', orgId)
      .send({ title: 'New Post', body: 'New body', assignedToId: fullUserId });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Post');
    expect(res.body.assignedToId).toBe(fullUserId);
  });

  it('returns 422 for invalid assignee', async () => {
    const res = await request(app)
      .post('/api/content')
      .set('Cookie', fullCookie)
      .set('x-org-id', orgId)
      .send({ title: 'X', body: 'Y', assignedToId: 'non-existent-id' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_ASSIGNEE');
  });
});

describe('DELETE /api/content/:id', () => {
  it('forbids READ role from deleting content', async () => {
    const res = await request(app)
      .delete(`/api/content/${contentId}`)
      .set('Cookie', readCookie)
      .set('x-org-id', orgId);

    expect(res.status).toBe(403);
  });

  it('allows FULL role to delete content', async () => {
    const res = await request(app)
      .delete(`/api/content/${contentId}`)
      .set('Cookie', fullCookie)
      .set('x-org-id', orgId);

    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test --workspace=@exam/api`
Expected: PASS — all `auth.test.ts` and `content.test.ts` cases pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/jest.config.js apps/api/.env.test apps/api/tests/ apps/api/package.json
git commit -m "test(api): add integration tests for auth and content RBAC"
```

---

## Task 12: Web Foundation (Vite + Router + Contexts + Layout)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/lib/axios.ts`
- Create: `apps/web/src/context/AuthContext.tsx`
- Create: `apps/web/src/context/OrgContext.tsx`
- Create: `apps/web/src/hooks/usePermission.ts`
- Create: `apps/web/src/components/Layout.tsx`
- Create: `apps/web/src/components/ProtectedRoute.tsx`
- Create: `apps/web/src/components/DataTable.tsx`
- Create: `apps/web/src/components/SlideOver.tsx`
- Create: `apps/web/src/pages/DashboardPage.tsx`
- Create: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Web package.json**

Create `apps/web/package.json`:
```json
{
  "name": "@exam/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 3000",
    "clean": "rm -rf dist .vite"
  },
  "dependencies": {
    "@exam/types": "*",
    "@tanstack/react-query": "^5.51.0",
    "axios": "^1.7.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Web tsconfig.json**

Create `apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "isolatedModules": true,
    "noEmit": true,
    "allowImportingTsExtensions": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Vite config (with API proxy)**

Create `apps/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 3000 },
});
```

- [ ] **Step 4: HTML entry**

Create `apps/web/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Global styles**

Create `apps/web/src/styles/globals.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #f9fafb; }

button { font: inherit; cursor: pointer; border: 0; border-radius: 6px; padding: 8px 16px; background: #2563eb; color: white; }
button:hover { background: #1d4ed8; }
button:disabled { background: #9ca3af; cursor: not-allowed; }
button.secondary { background: #e5e7eb; color: #1f2937; }
button.secondary:hover { background: #d1d5db; }
button.danger { background: #dc2626; }
button.danger:hover { background: #b91c1c; }

input, select, textarea { font: inherit; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; width: 100%; }
input:focus, select:focus, textarea:focus { outline: 2px solid #2563eb; outline-offset: 1px; }

table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
th { background: #f3f4f6; font-weight: 600; font-size: 14px; }

.app { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
.sidebar { background: #1f2937; color: white; padding: 24px 16px; }
.sidebar h1 { margin: 0 0 24px; font-size: 18px; }
.sidebar a { display: block; padding: 8px 12px; color: #d1d5db; text-decoration: none; border-radius: 6px; margin-bottom: 4px; }
.sidebar a:hover, .sidebar a.active { background: #374151; color: white; }

.main { display: flex; flex-direction: column; overflow: hidden; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: white; border-bottom: 1px solid #e5e7eb; }
.content { flex: 1; overflow: auto; padding: 24px; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; }

.slideover-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.slideover { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: white; padding: 24px; overflow: auto; z-index: 101; box-shadow: -4px 0 12px rgba(0,0,0,0.1); }
.slideover h3 { margin-top: 0; }
.form-field { margin-bottom: 16px; }
.form-field label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.form-actions { display: flex; gap: 8px; margin-top: 24px; }

.login-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; }
.login-card { background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: 360px; }
.login-card h1 { margin: 0 0 24px; }

.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-full { background: #dbeafe; color: #1e40af; }
.badge-read { background: #f3f4f6; color: #4b5563; }
.badge-draft { background: #fef3c7; color: #92400e; }
.badge-published { background: #d1fae5; color: #065f46; }

.error-text { color: #dc2626; font-size: 14px; margin-top: 8px; }
.empty-state { padding: 48px; text-align: center; color: #6b7280; }
```

- [ ] **Step 6: Axios instance**

Create `apps/web/src/lib/axios.ts`:
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let activeOrgId: string | null = null;

export const setActiveOrgId = (orgId: string | null) => {
  activeOrgId = orgId;
};

api.interceptors.request.use((config) => {
  if (activeOrgId) {
    config.headers['x-org-id'] = activeOrgId;
  }
  return config;
});

let isRefreshing = false;
let onLogout: (() => void) | null = null;
export const registerLogoutHandler = (fn: () => void) => { onLogout = fn; };

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post('/auth/refresh');
        } catch {
          if (onLogout) onLogout();
          throw err;
        } finally {
          isRefreshing = false;
        }
      }
      return api(original);
    }
    return Promise.reject(err);
  },
);
```

- [ ] **Step 7: AuthContext**

Create `apps/web/src/context/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserDTO } from '@exam/types';
import { api, registerLogoutHandler } from '../lib/axios';

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerLogoutHandler(() => setUser(null));
    api.post('/auth/refresh')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
```

- [ ] **Step 8: OrgContext**

Create `apps/web/src/context/OrgContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { OrganizationDTO } from '@exam/types';
import { api, setActiveOrgId } from '../lib/axios';
import { useAuth } from './AuthContext';

interface OrgContextValue {
  orgs: OrganizationDTO[];
  activeOrg: OrganizationDTO | null;
  setActiveOrg: (org: OrganizationDTO) => void;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);
const STORAGE_KEY = 'exam.activeOrgId';

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationDTO[]>([]);
  const [activeOrg, setActiveOrgState] = useState<OrganizationDTO | null>(null);

  const refresh = async () => {
    if (!user) {
      setOrgs([]);
      setActiveOrgState(null);
      setActiveOrgId(null);
      return;
    }
    const res = await api.get<OrganizationDTO[]>('/orgs');
    setOrgs(res.data);
    const stored = localStorage.getItem(STORAGE_KEY);
    const next = res.data.find((o) => o.id === stored) ?? res.data[0] ?? null;
    setActiveOrgState(next);
    setActiveOrgId(next?.id ?? null);
  };

  useEffect(() => { refresh(); }, [user]);

  const setActiveOrg = (org: OrganizationDTO) => {
    setActiveOrgState(org);
    setActiveOrgId(org.id);
    localStorage.setItem(STORAGE_KEY, org.id);
  };

  return (
    <OrgContext.Provider value={{ orgs, activeOrg, setActiveOrg, refresh }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider');
  return ctx;
};
```

- [ ] **Step 9: usePermission hook**

Create `apps/web/src/hooks/usePermission.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import type { AuthMeResponse } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';

export const usePermission = () => {
  const { activeOrg } = useOrg();

  const { data } = useQuery({
    queryKey: ['auth-me', activeOrg?.id],
    queryFn: async () => (await api.get<AuthMeResponse>('/auth/me')).data,
    enabled: !!activeOrg,
  });

  return {
    role: data?.membership?.role ?? null,
    canWrite: data?.membership?.role === 'FULL',
    canRead: !!data?.membership,
  };
};
```

- [ ] **Step 10: ProtectedRoute**

Create `apps/web/src/components/ProtectedRoute.tsx`:
```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 48 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};
```

- [ ] **Step 11: Layout (sidebar + topbar)**

Create `apps/web/src/components/Layout.tsx`:
```typescript
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { orgs, activeOrg, setActiveOrg } = useOrg();

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Admin</h1>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/organizations">Organizations</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/roles">Roles</NavLink>
        <NavLink to="/content">Content</NavLink>
      </aside>
      <div className="main">
        <header className="topbar">
          <select
            value={activeOrg?.id ?? ''}
            onChange={(e) => {
              const next = orgs.find((o) => o.id === e.target.value);
              if (next) setActiveOrg(next);
            }}
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{user?.name}</span>
            <button className="secondary" onClick={logout}>Log out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

- [ ] **Step 12: DataTable**

Create `apps/web/src/components/DataTable.tsx`:
```typescript
import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  empty?: string;
  rowKey: (row: T) => string;
}

export function DataTable<T>({ rows, columns, empty = 'No items', rowKey }: DataTableProps<T>) {
  if (rows.length === 0) return <div className="empty-state">{empty}</div>;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={c.width ? { width: c.width } : undefined}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((c, i) => <td key={i}>{c.render(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 13: SlideOver**

Create `apps/web/src/components/SlideOver.tsx`:
```typescript
import { ReactNode } from 'react';

interface SlideOverProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const SlideOver = ({ open, title, onClose, children }: SlideOverProps) => {
  if (!open) return null;
  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} />
      <aside className="slideover" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {children}
      </aside>
    </>
  );
};
```

- [ ] **Step 14: DashboardPage**

Create `apps/web/src/pages/DashboardPage.tsx`:
```typescript
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';

export const DashboardPage = () => {
  const { activeOrg } = useOrg();
  const { role } = usePermission();

  if (!activeOrg) return <p>No organization selected. Create or join one to get started.</p>;

  return (
    <>
      <div className="page-header"><h2>Dashboard</h2></div>
      <p>Active organization: <strong>{activeOrg.name}</strong></p>
      <p>Your role: <span className={`badge ${role === 'FULL' ? 'badge-full' : 'badge-read'}`}>{role ?? 'None'}</span></p>
      <p>Use the sidebar to manage organizations, teams, users, roles, and content.</p>
    </>
  );
};
```

- [ ] **Step 15: App root + main**

Create `apps/web/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
// LoginPage and resource pages added in subsequent tasks
import { LoginPage } from './pages/LoginPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { TeamsPage } from './pages/TeamsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { ContentPage } from './pages/ContentPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/content" element={<ContentPage />} />
              </Route>
            </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Create `apps/web/src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 16: Install web dependencies**

Run: `npm install --workspace=@exam/web`
Expected: Web dependencies installed.

- [ ] **Step 17: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold React admin shell with router, contexts, and layout"
```

Note: The build will fail until Task 13 adds `LoginPage` and Tasks 14–16 add the resource pages. Skip verifying `npm run build` for now.

---

## Task 13: Web LoginPage + Org Bootstrap

**Files:**
- Create: `apps/web/src/pages/LoginPage.tsx`

- [ ] **Step 1: Create LoginPage**

Create `apps/web/src/pages/LoginPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="login-shell">Loading…</div>;
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data?: { error?: string } } }).response?.data?.error
        : null;
      setError(message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Admin Login</h1>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/LoginPage.tsx
git commit -m "feat(web): add LoginPage with form validation"
```

---

## Task 14: Web Organizations + Teams Pages

**Files:**
- Create: `apps/web/src/pages/OrganizationsPage.tsx`
- Create: `apps/web/src/pages/TeamsPage.tsx`

- [ ] **Step 1: Create OrganizationsPage**

Create `apps/web/src/pages/OrganizationsPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrganizationDTO } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const OrganizationsPage = () => {
  const queryClient = useQueryClient();
  const { refresh } = useOrg();
  const { canWrite } = usePermission();
  const [editing, setEditing] = useState<OrganizationDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => (await api.get<OrganizationDTO[]>('/orgs')).data,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<OrganizationDTO>('/orgs', { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
      setCreating(false);
      setName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/orgs/${id}`, { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
      setEditing(null);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      refresh();
    },
  });

  const openCreate = () => { setCreating(true); setName(''); };
  const openEdit = (org: OrganizationDTO) => { setEditing(org); setName(org.name); };
  const close = () => { setCreating(false); setEditing(null); setName(''); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, name });
    else createMutation.mutate(name);
  };

  return (
    <>
      <div className="page-header">
        <h2>Organizations</h2>
        {canWrite && <button onClick={openCreate}>New organization</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={orgs}
          rowKey={(o) => o.id}
          columns={[
            { header: 'Name', render: (o) => o.name },
            { header: 'Created', render: (o) => new Date(o.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (o) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(o)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${o.name}?`)) deleteMutation.mutate(o.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit organization' : 'New organization'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save' : 'Create'}
            </button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
```

- [ ] **Step 2: Create TeamsPage**

Create `apps/web/src/pages/TeamsPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeamDTO } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const TeamsPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeamDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', activeOrg?.id],
    queryFn: async () => (await api.get<TeamDTO[]>(`/orgs/${activeOrg!.id}/teams`)).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post(`/orgs/${activeOrg!.id}/teams`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setCreating(false); setName(''); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/orgs/${activeOrg!.id}/teams/${id}`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setEditing(null); setName(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${activeOrg!.id}/teams/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const openCreate = () => { setCreating(true); setName(''); };
  const openEdit = (t: TeamDTO) => { setEditing(t); setName(t.name); };
  const close = () => { setCreating(false); setEditing(null); setName(''); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, name });
    else createMutation.mutate(name);
  };

  if (!activeOrg) return <p>Select an organization to manage teams.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Teams</h2>
        {canWrite && <button onClick={openCreate}>New team</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={teams}
          rowKey={(t) => t.id}
          columns={[
            { header: 'Name', render: (t) => t.name },
            { header: 'Created', render: (t) => new Date(t.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (t) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(t)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${t.name}?`)) deleteMutation.mutate(t.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit team' : 'New team'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/OrganizationsPage.tsx apps/web/src/pages/TeamsPage.tsx
git commit -m "feat(web): add organizations and teams CRUD pages"
```

---

## Task 15: Web Users + Roles Pages

**Files:**
- Create: `apps/web/src/pages/UsersPage.tsx`
- Create: `apps/web/src/pages/RolesPage.tsx`

- [ ] **Step 1: Create UsersPage**

Create `apps/web/src/pages/UsersPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserDTO } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

interface UserFormState {
  email: string;
  name: string;
  password: string;
}

const empty: UserFormState = { email: '', name: '', password: '' };

export const UsersPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UserFormState>(empty);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormState) => api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormState> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const openCreate = () => { setCreating(true); setForm(empty); };
  const openEdit = (u: UserDTO) => { setEditing(u); setForm({ email: u.email, name: u.name, password: '' }); };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const patch: Partial<UserFormState> = { email: form.email, name: form.name };
      if (form.password) patch.password = form.password;
      updateMutation.mutate({ id: editing.id, data: patch });
    } else {
      createMutation.mutate(form);
    }
  };

  if (!activeOrg) return <p>Select an organization to manage users.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Users</h2>
        {canWrite && <button onClick={openCreate}>New user</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={users}
          rowKey={(u) => u.id}
          columns={[
            { header: 'Name', render: (u) => u.name },
            { header: 'Email', render: (u) => u.email },
            { header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (u) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(u)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit user' : 'New user'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Password {editing && '(leave blank to keep)'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
```

- [ ] **Step 2: Create RolesPage**

Create `apps/web/src/pages/RolesPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserOrganizationDTO, UserDTO, Role } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

export const RolesPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UserOrganizationDTO | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('READ');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeOrg?.id],
    queryFn: async () => (await api.get<UserOrganizationDTO[]>(`/orgs/${activeOrg!.id}/members`)).data,
    enabled: !!activeOrg,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-roles'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const addMutation = useMutation({
    mutationFn: (data: { userId: string; role: Role }) =>
      api.post(`/orgs/${activeOrg!.id}/members`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.patch(`/orgs/${activeOrg!.id}/members/${userId}`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); close(); },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/orgs/${activeOrg!.id}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  const openAdd = () => { setAdding(true); setUserId(''); setRole('READ'); };
  const openEdit = (m: UserOrganizationDTO) => { setEditing(m); setRole(m.role); };
  const close = () => { setAdding(false); setEditing(null); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ userId: editing.userId, role });
    else addMutation.mutate({ userId, role });
  };

  const availableUsers = users.filter((u) => !members.some((m) => m.userId === u.id));

  if (!activeOrg) return <p>Select an organization to manage roles.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Roles (organization members)</h2>
        {canWrite && <button onClick={openAdd}>Add member</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={members}
          rowKey={(m) => m.userId}
          columns={[
            { header: 'User', render: (m) => m.user ? `${m.user.name} (${m.user.email})` : m.userId },
            { header: 'Role', render: (m) => <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span> },
            {
              header: 'Actions',
              render: (m) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(m)}>Change role</button>{' '}
                  <button className="danger" onClick={() => { if (confirm('Remove this member?')) removeMutation.mutate(m.userId); }}>Remove</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={adding || !!editing} title={editing ? 'Change role' : 'Add member'} onClose={close}>
        <form onSubmit={onSubmit}>
          {!editing && (
            <div className="form-field">
              <label>User</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select…</option>
                {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}
          <div className="form-field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="READ">READ (view only)</option>
              <option value="FULL">FULL (CRUD)</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Add'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/UsersPage.tsx apps/web/src/pages/RolesPage.tsx
git commit -m "feat(web): add users and roles CRUD pages"
```

---

## Task 16: Web ContentPage

**Files:**
- Create: `apps/web/src/pages/ContentPage.tsx`

- [ ] **Step 1: Create ContentPage**

Create `apps/web/src/pages/ContentPage.tsx`:
```typescript
import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContentDTO, UserDTO, ContentStatus } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';
import { usePermission } from '../hooks/usePermission';
import { DataTable } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';

interface ContentFormState {
  title: string;
  body: string;
  status: ContentStatus;
  assignedToId: string;
}

const empty: ContentFormState = { title: '', body: '', status: 'DRAFT', assignedToId: '' };

export const ContentPage = () => {
  const { activeOrg } = useOrg();
  const { canWrite } = usePermission();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ContentDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContentFormState>(empty);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: async () => (await api.get<ContentDTO[]>('/content')).data,
    enabled: !!activeOrg,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-content'],
    queryFn: async () => (await api.get<UserDTO[]>('/users')).data,
    enabled: !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: (data: ContentFormState) => api.post('/content', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContentFormState> }) =>
      api.patch(`/content/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content'] }),
  });

  const openCreate = () => { setCreating(true); setForm({ ...empty, assignedToId: users[0]?.id ?? '' }); };
  const openEdit = (c: ContentDTO) => {
    setEditing(c);
    setForm({ title: c.title, body: c.body, status: c.status, assignedToId: c.assignedToId });
  };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  if (!activeOrg) return <p>Select an organization to manage content.</p>;

  return (
    <>
      <div className="page-header">
        <h2>Content</h2>
        {canWrite && <button onClick={openCreate} disabled={users.length === 0}>New content</button>}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <DataTable
          rows={items}
          rowKey={(c) => c.id}
          columns={[
            { header: 'Title', render: (c) => c.title },
            { header: 'Status', render: (c) => <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span> },
            { header: 'Assigned to', render: (c) => c.assignedTo?.name ?? c.assignedToId },
            { header: 'Updated', render: (c) => new Date(c.updatedAt).toLocaleDateString() },
            {
              header: 'Actions',
              render: (c) => canWrite ? (
                <>
                  <button className="secondary" onClick={() => openEdit(c)}>Edit</button>{' '}
                  <button className="danger" onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteMutation.mutate(c.id); }}>Delete</button>
                </>
              ) : null,
            },
          ]}
        />
      )}
      <SlideOver open={creating || !!editing} title={editing ? 'Edit content' : 'New content'} onClose={close}>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Body</label>
            <textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>
          <div className="form-field">
            <label>Assigned to</label>
            <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} required>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
};
```

- [ ] **Step 2: Verify web build**

Run: `npm run build --workspace=@exam/web`
Expected: PASS — no TypeScript errors, `dist/` produced.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ContentPage.tsx
git commit -m "feat(web): add content CRUD page"
```

---

## Task 17: Expo Mobile App (Login + ContentListScreen)

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/App.tsx`
- Create: `apps/mobile/lib/storage.ts`
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/screens/LoginScreen.tsx`
- Create: `apps/mobile/screens/ContentListScreen.tsx`
- Create: `apps/mobile/components/ContentCard.tsx`

- [ ] **Step 1: Mobile package.json**

Create `apps/mobile/package.json`:
```json
{
  "name": "@exam/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web --port 19006",
    "clean": "rm -rf .expo dist"
  },
  "dependencies": {
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "expo": "~51.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Mobile tsconfig.json**

Create `apps/mobile/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-native",
    "lib": ["ES2022"],
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 3: Expo app.json**

Create `apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "Admin Content",
    "slug": "admin-content",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "web": { "bundler": "metro" },
    "userInterfaceStyle": "light",
    "extra": {
      "apiUrl": "http://localhost:4000/api"
    }
  }
}
```

- [ ] **Step 4: Babel config**

Create `apps/mobile/babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 5: Storage helper**

Create `apps/mobile/lib/storage.ts`:
```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

const isSecureStoreAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

export const setItem = async (key: string, value: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memoryStore.set(key, value);
    try { localStorage.setItem(key, value); } catch { /* ignored */ }
  }
};

export const getItem = async (key: string): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  }
  try { return localStorage.getItem(key); } catch { return memoryStore.get(key) ?? null; }
};

export const deleteItem = async (key: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    memoryStore.delete(key);
    try { localStorage.removeItem(key); } catch { /* ignored */ }
  }
};
```

- [ ] **Step 6: API helper**

Create `apps/mobile/lib/api.ts`:
```typescript
import Constants from 'expo-constants';
import { getItem } from './storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://localhost:4000/api';

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = await getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
};
```

- [ ] **Step 7: Login screen**

Create `apps/mobile/screens/LoginScreen.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import type { UserDTO } from '@exam/types';
import { apiFetch } from '../lib/api';
import { setItem } from '../lib/storage';

interface LoginResponse {
  user: UserDTO;
  accessToken: string;
}

interface Props {
  onLoggedIn: (user: UserDTO) => void;
}

export const LoginScreen = ({ onLoggedIn }: Props) => {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setItem('access_token', res.accessToken);
      await setItem('user_id', res.user.id);
      onLoggedIn(res.user);
    } catch (err) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#1f2937' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 8: ContentCard component**

Create `apps/mobile/components/ContentCard.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import type { ContentDTO } from '@exam/types';

export const ContentCard = ({ item }: { item: ContentDTO }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
    <View style={styles.footer}>
      <View style={[styles.badge, item.status === 'PUBLISHED' ? styles.badgePublished : styles.badgeDraft]}>
        <Text style={[styles.badgeText, item.status === 'PUBLISHED' ? styles.badgePublishedText : styles.badgeDraftText]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  body: { fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgePublished: { backgroundColor: '#d1fae5' },
  badgePublishedText: { color: '#065f46' },
  badgeDraft: { backgroundColor: '#fef3c7' },
  badgeDraftText: { color: '#92400e' },
  date: { fontSize: 12, color: '#6b7280' },
});
```

- [ ] **Step 9: ContentListScreen**

Create `apps/mobile/screens/ContentListScreen.tsx`:
```typescript
import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import type { ContentDTO, UserDTO } from '@exam/types';
import { apiFetch } from '../lib/api';
import { deleteItem } from '../lib/storage';
import { ContentCard } from '../components/ContentCard';

interface Props {
  user: UserDTO;
  onLogout: () => void;
}

export const ContentListScreen = ({ user, onLogout }: Props) => {
  const [items, setItems] = useState<ContentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<ContentDTO[]>(`/content/user/${user.id}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    await deleteItem('access_token');
    await deleteItem('user_id');
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Content for {user.name}</Text>
          <Text style={styles.headerSubtitle}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ContentCard item={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No content assigned yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logout: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 48 },
  error: { color: '#dc2626', marginBottom: 12, textAlign: 'center', paddingHorizontal: 24 },
  retry: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: 'white', fontWeight: '500' },
});
```

- [ ] **Step 10: App entry**

Create `apps/mobile/App.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { UserDTO } from '@exam/types';
import { LoginScreen } from './screens/LoginScreen';
import { ContentListScreen } from './screens/ContentListScreen';
import { apiFetch } from './lib/api';
import { getItem } from './lib/storage';

interface MeResponse { user: UserDTO; }

export default function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getItem('access_token');
      if (!token) { setLoading(false); return; }
      try {
        const me = await apiFetch<MeResponse>('/auth/me');
        setUser(me.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {user
        ? <ContentListScreen user={user} onLogout={() => setUser(null)} />
        : <LoginScreen onLoggedIn={setUser} />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
});
```

- [ ] **Step 11: Install mobile dependencies**

Run: `npm install --workspace=@exam/mobile`
Expected: Mobile dependencies installed.

- [ ] **Step 12: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): add Expo login + content list screen"
```

---

## Task 18: Docker Compose + Dockerfiles

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/nginx.conf`
- Create: `apps/web/.dockerignore`
- Create: `apps/mobile/Dockerfile`
- Create: `apps/mobile/.dockerignore`
- Create: `docker-compose.yml`

- [ ] **Step 1: API Dockerfile**

Create `apps/api/Dockerfile`:
```dockerfile
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
```

- [ ] **Step 2: API .dockerignore**

Create `apps/api/.dockerignore`:
```
node_modules
dist
.env
.env.test
.env.local
*.log
```

- [ ] **Step 3: Web nginx.conf**

Create `apps/web/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }
}
```

- [ ] **Step 4: Web Dockerfile**

Create `apps/web/Dockerfile`:
```dockerfile
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
```

- [ ] **Step 5: Web .dockerignore**

Create `apps/web/.dockerignore`:
```
node_modules
dist
.vite
.env
*.log
```

- [ ] **Step 6: Mobile Dockerfile**

Create `apps/mobile/Dockerfile`:
```dockerfile
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
```

- [ ] **Step 7: Mobile .dockerignore**

Create `apps/mobile/.dockerignore`:
```
node_modules
.expo
.expo-shared
dist
*.log
```

- [ ] **Step 8: docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-exam}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-exam}
      JWT_SECRET: ${JWT_SECRET:-dev-jwt-secret-change-me-32-chars-min}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev-refresh-secret-change-me-32-chars-min}
      CORS_ORIGIN: http://localhost:3000,http://localhost:19006
      PORT: "4000"
      NODE_ENV: production
    ports:
      - "4000:4000"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "3000:80"

  mobile:
    build:
      context: .
      dockerfile: apps/mobile/Dockerfile
    restart: unless-stopped
    depends_on:
      - api
    environment:
      EXPO_PUBLIC_API_URL: http://localhost:4000/api
    ports:
      - "19006:19006"
      - "8081:8081"
      - "19000:19000"

volumes:
  postgres_data:
```

- [ ] **Step 9: Boot the stack**

Run: `docker-compose up --build`
Expected: All four services start. Logs show:
- `postgres` ready to accept connections
- `api`: `Prisma migrate deploy` applied migrations, `Seed complete`, `API listening on http://localhost:4000`
- `web`: nginx serving on port 80 (mapped to host 3000)
- `mobile`: Expo dev server on port 19006

Verify in browser:
- `http://localhost:3000` → admin login page
- `http://localhost:19006` → mobile login screen
- `http://localhost:4000/api/health` → `{"status":"ok"}`

Login at `http://localhost:3000` with `admin@example.com` / `password`. Verify you can list/create/edit/delete organizations, teams, users, roles, and content. Then log into the mobile app at `http://localhost:19006` with `alice@example.com` / `password` and verify the content list appears.

Stop with `Ctrl+C`, then `docker-compose down` to remove containers (data persists in `postgres_data` volume).

- [ ] **Step 10: Commit**

```bash
git add apps/api/Dockerfile apps/api/.dockerignore apps/web/Dockerfile apps/web/nginx.conf apps/web/.dockerignore apps/mobile/Dockerfile apps/mobile/.dockerignore docker-compose.yml
git commit -m "feat(infra): add Dockerfiles and docker-compose for full stack"
```

---

## Task 19: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:
````markdown
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
cd exam
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
npm run db:migrate --workspace=@exam/api
npm run db:seed   --workspace=@exam/api

# 5. Start all three apps with hot reload
npm run dev
```

The API runs at :4000, the web admin at http://localhost:5173 (Vite proxies `/api/*` to the API), and Expo CLI prints a QR code for the mobile app.

## Project Structure

```
exam/
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
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

npm test --workspace=@exam/api
```

## Design Documents

- Spec: [`docs/superpowers/specs/2026-05-13-admin-platform-design.md`](docs/superpowers/specs/2026-05-13-admin-platform-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-05-13-admin-platform.md`](docs/superpowers/plans/2026-05-13-admin-platform.md)
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## Verification Checklist

After all 19 tasks are complete, verify the entire stack:

- [ ] `docker-compose up --build` starts all four services without errors
- [ ] `http://localhost:4000/api/health` returns `{"status":"ok"}`
- [ ] Login at `http://localhost:3000` as `admin@example.com` / `password` succeeds
- [ ] As `admin`, create/edit/delete an organization, team, user, role assignment, and content item
- [ ] Log out and log in as `bob@example.com` (READ role): no Create/Edit/Delete buttons visible, and direct API calls to mutating endpoints return 403
- [ ] At `http://localhost:19006`, log in as `alice@example.com` and verify her assigned content appears
- [ ] Pull-to-refresh on mobile updates the content list
- [ ] `npm test --workspace=@exam/api` passes (after creating `exam_test` database)
- [ ] `docker-compose down` cleanly stops services; `docker-compose up` resumes with persisted data
