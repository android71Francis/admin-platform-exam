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
