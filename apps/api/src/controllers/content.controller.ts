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
