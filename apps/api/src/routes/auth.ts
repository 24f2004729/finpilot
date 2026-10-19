import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { authRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import { RegisterSchema, LoginSchema } from '@finpilot/shared';

const router = Router();

// Register new account
router.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const { user, token } = await AuthService.register(validated);

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: err.message },
      });
    }
    next(err);
  }
});

// Login
router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const { user, token } = await AuthService.login(validated);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: { user, token },
    });
  } catch (err: any) {
    if (err.message === 'Invalid email or password.') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: err.message },
      });
    }
    next(err);
  }
});

// 1-Click Instant Demo Login
router.post('/demo', (req: Request, res: Response) => {
  const { user, token } = AuthService.getDemoAccount();

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    data: { user, token },
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({
    success: true,
    data: { message: 'Signed out successfully.' },
  });
});

// Current User Profile
router.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: { user: req.user },
  });
});

export default router;
