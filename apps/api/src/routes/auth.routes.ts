import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
