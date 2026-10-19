import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import { MonthQuerySchema, DismissInsightSchema, formatMonthKey } from '@finpilot/shared';

const router = Router();
router.use(requireAuth);

// Monthly Summary (Income, Expenses, Net Flow, Savings Rate)
router.get('/summary', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = MonthQuerySchema.parse(req.query);
    const monthKey = validated.month || formatMonthKey(new Date());
    const summary = AnalyticsService.getMonthlySummary(req.user!.id, monthKey);
    return res.json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
});

// Category Expense Breakdown (Deterministic descending sort)
router.get('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = MonthQuerySchema.parse(req.query);
    const monthKey = validated.month || formatMonthKey(new Date());
    const breakdown = AnalyticsService.getCategoryBreakdown(req.user!.id, monthKey);
    return res.json({ success: true, data: { breakdown } });
  } catch (err) {
    next(err);
  }
});

// Non-judgmental Spending Insights
router.get('/insights', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = MonthQuerySchema.parse(req.query);
    const monthKey = validated.month || formatMonthKey(new Date());
    const insights = AnalyticsService.getSpendingInsights(req.user!.id, monthKey);
    return res.json({ success: true, data: { insights } });
  } catch (err) {
    next(err);
  }
});

// Dismiss Spending Insight
router.post('/insights/dismiss', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = DismissInsightSchema.parse(req.body);
    AnalyticsService.dismissInsight(req.user!.id, validated.insightKey, validated.monthKey);
    return res.json({ success: true, data: { message: 'Insight dismissed.' } });
  } catch (err) {
    next(err);
  }
});

export default router;
