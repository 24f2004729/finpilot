import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { BudgetService } from '../services/budgetService';
import { CreateBudgetSchema, UpdateBudgetSchema, formatMonthKey } from '@finpilot/shared';

const router = Router();
router.use(requireAuth);

// List budgets for a specific month
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const monthKey = (req.query.monthKey as string) || formatMonthKey(new Date());
    const budgets = BudgetService.listBudgets(req.user!.id, monthKey);
    return res.json({ success: true, data: { budgets } });
  } catch (err) {
    next(err);
  }
});

// Create new budget
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateBudgetSchema.parse(req.body);
    const budget = BudgetService.createBudget(req.user!.id, validated);
    return res.status(201).json({ success: true, data: { budget } });
  } catch (err: any) {
    if (err.message && err.message.includes('already has a budget')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BUDGET_ALREADY_EXISTS',
          message: err.message,
        },
      });
    }
    next(err);
  }
});

// Update budget limit
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateBudgetSchema.parse(req.body);
    const budget = BudgetService.updateBudget(req.user!.id, req.params.id, validated);
    return res.json({ success: true, data: { budget } });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: err.message },
      });
    }
    next(err);
  }
});

// Delete budget
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    BudgetService.deleteBudget(req.user!.id, req.params.id);
    return res.json({ success: true, data: { message: 'Budget removed successfully.' } });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: err.message },
      });
    }
    next(err);
  }
});

export default router;
