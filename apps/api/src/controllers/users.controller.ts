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
