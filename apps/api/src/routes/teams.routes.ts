import { Router } from 'express';
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/teams.controller';
import { requireFullAccess } from '../middleware/requireFullAccess';

export const teamsRouter = Router({ mergeParams: true });

teamsRouter.get('/', listTeams);
teamsRouter.get('/:id', getTeam);
teamsRouter.post('/', requireFullAccess, createTeam);
teamsRouter.patch('/:id', requireFullAccess, updateTeam);
teamsRouter.delete('/:id', requireFullAccess, deleteTeam);
teamsRouter.post('/:id/members', requireFullAccess, addTeamMember);
teamsRouter.delete('/:id/members/:userId', requireFullAccess, removeTeamMember);
