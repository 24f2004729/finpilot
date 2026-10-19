import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  currency: string;
  isDemo: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required to access this resource.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const userRow = db.prepare('SELECT id, email, full_name, currency, is_demo FROM users WHERE id = ?').get(decoded.userId) as any;

    if (!userRow) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The authenticated user session is no longer valid.',
        },
      });
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      currency: userRow.currency,
      isDemo: Boolean(userRow.is_demo),
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Session has expired or is invalid. Please sign in again.',
      },
    });
  }
}
