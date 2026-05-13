import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.access_token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }

  req.user = payload;
  next();
};
