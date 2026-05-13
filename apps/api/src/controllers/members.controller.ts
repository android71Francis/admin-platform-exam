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
