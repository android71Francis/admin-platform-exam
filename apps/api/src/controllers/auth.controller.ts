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
