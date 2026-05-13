import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

export interface TokenPayload {
  id: string;
}

export const signAccessToken = (userId: string): string =>
  jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '15m' });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};
