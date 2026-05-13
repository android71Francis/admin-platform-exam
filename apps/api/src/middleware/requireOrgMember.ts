import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const requireOrgMember = async (req: Request, res: Response, next: NextFunction) => {
  const orgId = (req.headers['x-org-id'] as string) || req.params.orgId;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization context required (x-org-id header)', code: 'ORG_REQUIRED' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: req.user.id, organizationId: orgId } },
    include: { organization: true },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this organization', code: 'NOT_ORG_MEMBER' });
  }

  req.membership = membership;
  next();
};
