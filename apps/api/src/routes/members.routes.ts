import { Router } from 'express';
import { listMembers, addMember, updateMember, removeMember } from '../controllers/members.controller';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const membersRouter = Router({ mergeParams: true });

membersRouter.get('/', listMembers);
membersRouter.post('/', requireFullAccess, addMember);
membersRouter.patch('/:userId', requireFullAccess, updateMember);
membersRouter.delete('/:userId', requireFullAccess, removeMember);
