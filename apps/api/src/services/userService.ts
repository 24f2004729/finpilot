import { db } from '../db/database';

export class UserService {
  static exportAllData(userId: string) {
    const user = db.prepare('SELECT id, email, full_name, currency, is_demo, created_at, updated_at FROM users WHERE id = ?').get(userId);
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY occurrence_date DESC').all(userId);
    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ? ORDER BY month_key DESC, category ASC').all(userId);

    return {
      exportedAt: new Date().toISOString(),
      user,
      transactions,
      budgets,
    };
  }

  static deleteAccount(userId: string): { success: boolean; deletedCounts: Record<string, number> } {
    // Cascade delete across all tables
    const deleteTx = db.transaction(() => {
      const txRes = db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      const budgetRes = db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
      const dismissRes = db.prepare('DELETE FROM insight_dismissals WHERE user_id = ?').run(userId);
      const auditRes = db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(userId);
      const userRes = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      return {
        transactions: txRes.changes,
        budgets: budgetRes.changes,
        insightDismissals: dismissRes.changes,
        auditLogs: auditRes.changes,
        users: userRes.changes,
      };
    });

    const deletedCounts = deleteTx();
    return { success: true, deletedCounts };
  }
}
