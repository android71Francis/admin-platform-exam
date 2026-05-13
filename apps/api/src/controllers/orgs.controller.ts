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
