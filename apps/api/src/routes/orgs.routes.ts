import { Router } from 'express';
import { listOrgs, getOrg, createOrg, updateOrg, deleteOrg } from '../controllers/orgs.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireOrgMember } from '../middleware/requireOrgMember';
import { requireFullAccess } from '../middleware/requireFullAccess';
import { teamsRouter } from './teams.routes';
import { membersRouter } from './members.routes';

export const orgsRouter = Router();

orgsRouter.use(requireAuth);

orgsRouter.use('/:orgId/teams',
  (req, _res, next) => { req.headers['x-org-id'] = req.params.orgId; next(); },
  requireOrgMember,
  teamsRouter,
);

orgsRouter.use('/:orgId/members',
  (req, _res, next) => { req.headers['x-org-id'] = req.params.orgId; next(); },
  requireOrgMember,
  membersRouter,
);

orgsRouter.get('/', listOrgs);
orgsRouter.post('/', createOrg);

orgsRouter.get('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, getOrg);
orgsRouter.patch('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, requireFullAccess, updateOrg);
orgsRouter.delete('/:id', (req, _res, next) => { req.headers['x-org-id'] = req.params.id; next(); }, requireOrgMember, requireFullAccess, deleteOrg);
