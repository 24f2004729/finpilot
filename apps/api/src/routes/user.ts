import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { UserService } from '../services/userService';
import { DeleteAccountSchema } from '@finpilot/shared';

const router = Router();
router.use(requireAuth);

// Full JSON Data Export (Data Minimization & User Control per Chapter 19)
router.get('/export', (req: Request, res: Response) => {
  const data = UserService.exportAllData(req.user!.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=finpilot-account-export.json');
  return res.json({ success: true, data });
});

// Cascading Account Deletion
router.delete('/account', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = DeleteAccountSchema.parse(req.body);
    const result = UserService.deleteAccount(req.user!.id);
    res.clearCookie('token');
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
