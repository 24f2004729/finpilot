import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import {
  Budget,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  calculateBudgetUtilization,
  formatMonthDisplay
} from '@finpilot/shared';

export class BudgetService {
  static listBudgets(userId: string, monthKey: string): Budget[] {
    // Fetch budgets for user and month
    const budgets = db.prepare(`
      SELECT * FROM budgets WHERE user_id = ? AND month_key = ? ORDER BY category ASC
    `).all(userId, monthKey) as any[];

    // Calculate spent_cents for each category by summing expense transactions in that month
    const expenseSums = db.prepare(`
      SELECT category, SUM(amount_cents) as total_spent
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND occurrence_date LIKE ?
      GROUP BY category
    `).all(userId, `${monthKey}%`) as Array<{ category: string; total_spent: number }>;

    const spentMap = new Map<string, number>();
    for (const exp of expenseSums) {
      spentMap.set(exp.category, exp.total_spent);
    }

    return budgets.map(b => {
      const spentCents = spentMap.get(b.category) || 0;
      const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(spentCents, b.limit_cents);

      return {
        id: b.id,
        userId: b.user_id,
        category: b.category,
        monthKey: b.month_key,
        limitCents: b.limit_cents,
        spentCents,
        remainingCents,
        utilizationPercent,
        status,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      };
    });
  }

  static createBudget(userId: string, data: typeof CreateBudgetSchema._type): Budget {
    // Check if budget already exists for this category and month
    const existing = db.prepare(`
      SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month_key = ?
    `).get(userId, data.category, data.monthKey);

    if (existing) {
      const monthName = formatMonthDisplay(data.monthKey);
      throw new Error(`This category already has a budget for ${monthName}. Edit the existing budget or choose another category.`);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO budgets (id, user_id, category, month_key, limit_cents, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.category, data.monthKey, data.limitCents, now, now);

    // Calculate current spend
    const spentRow = db.prepare(`
      SELECT SUM(amount_cents) as spent FROM transactions
      WHERE user_id = ? AND type = 'expense' AND category = ? AND occurrence_date LIKE ?
    `).get(userId, data.category, `${data.monthKey}%`) as { spent: number | null };

    const spentCents = spentRow?.spent || 0;
    const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(spentCents, data.limitCents);

    return {
      id,
      userId,
      category: data.category,
      monthKey: data.monthKey,
      limitCents: data.limitCents,
      spentCents,
      remainingCents,
      utilizationPercent,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  static updateBudget(userId: string, id: string, data: typeof UpdateBudgetSchema._type): Budget {
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      throw new Error('Budget not found or you do not have permission to modify it.');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE budgets SET limit_cents = ?, updated_at = ? WHERE id = ? AND user_id = ?
    `).run(data.limitCents, now, id, userId);

    const spentRow = db.prepare(`
      SELECT SUM(amount_cents) as spent FROM transactions
      WHERE user_id = ? AND type = 'expense' AND category = ? AND occurrence_date LIKE ?
    `).get(userId, existing.category, `${existing.month_key}%`) as { spent: number | null };

    const spentCents = spentRow?.spent || 0;
    const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(spentCents, data.limitCents);

    return {
      id,
      userId,
      category: existing.category,
      monthKey: existing.month_key,
      limitCents: data.limitCents,
      spentCents,
      remainingCents,
      utilizationPercent,
      status,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  static deleteBudget(userId: string, id: string): boolean {
    const res = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, userId);
    if (res.changes === 0) {
      throw new Error('Budget not found or you do not have permission to delete it.');
    }
    return true;
  }
}
