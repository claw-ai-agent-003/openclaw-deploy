import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { getSession, getUserById } from '../services/auth.service.js';
import { AppError } from './error-handler.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        githubId: number;
        username: string;
        email: string | null;
        avatarUrl: string;
      };
    }
  }
}

export const requireAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.session_token;

  if (!token) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }

  const session = await getSession(token);
  if (!session) {
    next(new AppError(401, 'Session expired or invalid', 'UNAUTHORIZED'));
    return;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    next(new AppError(401, 'User not found', 'UNAUTHORIZED'));
    return;
  }

  req.user = user;
  next();
};
