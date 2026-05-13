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
