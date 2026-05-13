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
