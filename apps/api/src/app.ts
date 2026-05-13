import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { orgsRouter } from './routes/orgs.routes';
import { usersRouter } from './routes/users.routes';

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/orgs', orgsRouter);
  app.use('/api/users', usersRouter);
  // app.use('/api/content', contentRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
};
