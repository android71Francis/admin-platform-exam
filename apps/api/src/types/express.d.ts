import { UserOrganization, Organization } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      membership?: UserOrganization & { organization: Organization };
    }
  }
}

export {};
