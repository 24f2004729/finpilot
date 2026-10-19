import { db } from '../db/database';
import {
  MonthlySummary,
  CategoryBreakdownItem,
  SpendingInsight,
  SYSTEM_CATEGORIES,
  calculateNetCashFlow,
  calculateSavingsRate,
  getPreviousMonthKey,
  formatCurrency,
  centsToDollars,
  dollarsToCents,
  SupportedCurrency
} from '@finpilot/shared';

export class AnalyticsService {
  static getMonthlySummary(userId: string, monthKey: string): MonthlySummary {
    const userRow = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId) as { currency: SupportedCurrency } | undefined;
    const currency = userRow?.currency || 'USD';

    // Calculate sum of income transactions
    const incomeRow = db.prepare(`
      SELECT SUM(amount_cents) as total FROM transactions
      WHERE user_id = ? AND type = 'income' AND occurrence_date LIKE ?
    `).get(userId, `${monthKey}%`) as { total: number | null };

    // Calculate sum of expense transactions
    const expenseRow = db.prepare(`
      SELECT SUM(amount_cents) as total FROM transactions
      WHERE user_id = ? AND type = 'expense' AND occurrence_date LIKE ?
    `).get(userId, `${monthKey}%`) as { total: number | null };

    const totalIncomeCents = incomeRow?.total || 0;
    const totalExpenseCents = expenseRow?.total || 0;
    const netCashFlowCents = calculateNetCashFlow(totalIncomeCents, totalExpenseCents);
    const savingsRatePercent = calculateSavingsRate(totalIncomeCents, totalExpenseCents);

    return {
      monthKey,
      totalIncomeCents,
      totalExpenseCents,
      netCashFlowCents,
      savingsRatePercent,
      currency,
    };
  }

  static getCategoryBreakdown(userId: string, monthKey: string): CategoryBreakdownItem[] {
    const rows = db.prepare(`
      SELECT category, SUM(amount_cents) as total_cents, COUNT(id) as tx_count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND occurrence_date LIKE ?
      GROUP BY category
      ORDER BY total_cents DESC, category ASC
    `).all(userId, `${monthKey}%`) as Array<{ category: string; total_cents: number; tx_count: number }>;

    const totalExpenseRow = db.prepare(`
      SELECT SUM(amount_cents) as grand_total FROM transactions
      WHERE user_id = ? AND type = 'expense' AND occurrence_date LIKE ?
    `).get(userId, `${monthKey}%`) as { grand_total: number | null };

    const grandTotal = totalExpenseRow?.grand_total || 0;

    return rows.map(r => {
      const def = SYSTEM_CATEGORIES.find(c => c.id === r.category);
      const categoryName = def ? def.name : r.category;
      const color = def ? def.color : '#94A3B8';
      const percentage = grandTotal > 0 ? Math.round((r.total_cents / grandTotal) * 1000) / 10 : 0;

      return {
        category: r.category,
        categoryName,
        color,
        totalCents: r.total_cents,
        percentageOfExpenses: percentage,
        transactionCount: r.tx_count,
      };
    });
  }

  static getSpendingInsights(userId: string, currentMonthKey: string): SpendingInsight[] {
    // Determine 3 preceding months for baseline calculation
    const m1 = getPreviousMonthKey(currentMonthKey);
    const m2 = getPreviousMonthKey(m1);
    const m3 = getPreviousMonthKey(m2);

    // Fetch current month expense totals per category
    const currentSpends = db.prepare(`
      SELECT category, SUM(amount_cents) as total_cents
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND occurrence_date LIKE ?
      GROUP BY category
    `).all(userId, `${currentMonthKey}%`) as Array<{ category: string; total_cents: number }>;

    // Fetch 3-month historical totals
    const historicalRows = db.prepare(`
      SELECT category, SUM(amount_cents) as total_cents, COUNT(DISTINCT SUBSTR(occurrence_date, 1, 7)) as active_months
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND (
        occurrence_date LIKE ? OR occurrence_date LIKE ? OR occurrence_date LIKE ?
      )
      GROUP BY category
    `).all(userId, `${m1}%`, `${m2}%`, `${m3}%`) as Array<{ category: string; total_cents: number; active_months: number }>;

    const baselineMap = new Map<string, number>();
    for (const h of historicalRows) {
      const months = Math.max(h.active_months, 1);
      baselineMap.set(h.category, Math.round(h.total_cents / months));
    }

    // Fetch dismissed insight keys
    const dismissedRows = db.prepare(`
      SELECT insight_key FROM insight_dismissals WHERE user_id = ? AND month_key = ?
    `).all(userId, currentMonthKey) as Array<{ insight_key: string }>;
    const dismissedSet = new Set(dismissedRows.map(d => d.insight_key));

    const insights: SpendingInsight[] = [];

    for (const cur of currentSpends) {
      const baseline = baselineMap.get(cur.category) || 0;
      if (baseline <= 0) continue; // No historical baseline to compare

      const diffCents = cur.total_cents - baseline;
      const pctDiff = Math.round((diffCents / baseline) * 100);

      const categoryDef = SYSTEM_CATEGORIES.find(c => c.id === cur.category);
      const categoryName = categoryDef ? categoryDef.name : cur.category;
      const insightKey = `spending_delta_${cur.category}`;

      // Only generate insight for meaningful upward or downward changes (>= 20% diff and >= $30 difference)
      if (Math.abs(pctDiff) >= 20 && Math.abs(diffCents) >= 3000) {
        const isHigher = diffCents > 0;
        const formattedCur = formatCurrency(cur.total_cents);
        const formattedBase = formatCurrency(baseline);
        const formattedDiff = formatCurrency(Math.abs(diffCents));

        const headline = isHigher
          ? `${categoryName} spending is ${pctDiff}% higher than average`
          : `${categoryName} spending is ${Math.abs(pctDiff)}% below average`;

        // Strict Chapter 19 & 40 Compliance: Non-judgmental, explain baseline and difference
        const explanation = isHigher
          ? `You have spent ${formattedCur} this month compared to your 3-month baseline average of ${formattedBase} (a difference of +${formattedDiff}).`
          : `You have spent ${formattedCur} this month compared to your 3-month baseline average of ${formattedBase} (a difference of -${formattedDiff}).`;

        insights.push({
          id: insightKey,
          category: cur.category,
          categoryName,
          monthKey: currentMonthKey,
          currentSpendCents: cur.total_cents,
          baselineSpendCents: baseline,
          percentageDifference: pctDiff,
          amountDifferenceCents: diffCents,
          headline,
          explanation,
          dismissed: dismissedSet.has(insightKey),
        });
      }
    }

    return insights;
  }

  static dismissInsight(userId: string, insightKey: string, monthKey: string): void {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO insight_dismissals (id, user_id, insight_key, month_key, dismissed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`${userId}_${insightKey}_${monthKey}`, userId, insightKey, monthKey, now);
  }
}
