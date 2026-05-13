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
