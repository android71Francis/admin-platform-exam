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
