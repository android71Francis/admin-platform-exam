import { Request, Response, NextFunction } from 'express';

export const requireFullAccess = (req: Request, res: Response, next: NextFunction) => {
  if (req.membership?.role !== 'FULL') {
    return res.status(403).json({ error: 'Full access required for this operation', code: 'FORBIDDEN' });
  }
  next();
};
