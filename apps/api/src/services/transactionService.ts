import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import {
  Transaction,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFilterSchema,
  exportToCsv,
  dollarsToCents,
  centsToDollars,
  CsvTransactionRow
} from '@finpilot/shared';

export class TransactionService {
  static listTransactions(
    userId: string,
    filters: typeof TransactionFilterSchema._type
  ): { transactions: Transaction[]; total: number; page: number; totalPages: number } {
    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    let countSql = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?';
    const params: any[] = [userId];
    const countParams: any[] = [userId];

    if (filters.monthKey) {
      sql += ' AND occurrence_date LIKE ?';
      countSql += ' AND occurrence_date LIKE ?';
      params.push(`${filters.monthKey}%`);
      countParams.push(`${filters.monthKey}%`);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(filters.category);
      countParams.push(filters.category);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(filters.type);
      countParams.push(filters.type);
    }

    if (filters.search) {
      sql += ' AND (description LIKE ? OR notes LIKE ?)';
      countSql += ' AND (description LIKE ? OR notes LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      countParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const totalRow = db.prepare(countSql).get(...countParams) as { count: number };
    const total = totalRow ? totalRow.count : 0;

    sql += ' ORDER BY occurrence_date DESC, created_at DESC';

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as any[];

    const transactions: Transaction[] = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      amountCents: r.amount_cents,
      type: r.type,
      category: r.category,
      occurrenceDate: r.occurrence_date,
      description: r.description,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static getById(userId: string, id: string): Transaction | null {
    const row = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      amountCents: row.amount_cents,
      type: row.type,
      category: row.category,
      occurrenceDate: row.occurrence_date,
      description: row.description,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static create(userId: string, data: typeof CreateTransactionSchema._type): Transaction {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (id, user_id, amount_cents, type, category, occurrence_date, description, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      data.amountCents,
      data.type,
      data.category,
      data.occurrenceDate,
      data.description,
      data.notes || null,
      now,
      now
    );

    return {
      id,
      userId,
      amountCents: data.amountCents,
      type: data.type,
      category: data.category,
      occurrenceDate: data.occurrenceDate,
      description: data.description,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  static update(userId: string, id: string, data: typeof UpdateTransactionSchema._type): Transaction {
    const existing = this.getById(userId, id);
    if (!existing) {
      throw new Error('Transaction not found or you do not have permission to modify it.');
    }

    const now = new Date().toISOString();
    const amountCents = data.amountCents ?? existing.amountCents;
    const type = data.type ?? existing.type;
    const category = data.category ?? existing.category;
    const occurrenceDate = data.occurrenceDate ?? existing.occurrenceDate;
    const description = data.description ?? existing.description;
    const notes = data.notes !== undefined ? data.notes : existing.notes;

    db.prepare(`
      UPDATE transactions
      SET amount_cents = ?, type = ?, category = ?, occurrence_date = ?, description = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(amountCents, type, category, occurrenceDate, description, notes, now, id, userId);

    return {
      id,
      userId,
      amountCents,
      type,
      category,
      occurrenceDate,
      description,
      notes,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  static delete(userId: string, id: string): boolean {
    const res = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
    if (res.changes === 0) {
      throw new Error('Transaction not found or you do not have permission to delete it.');
    }
    return true;
  }

  static exportCsv(userId: string, monthKey?: string): string {
    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params: any[] = [userId];

    if (monthKey) {
      sql += ' AND occurrence_date LIKE ?';
      params.push(`${monthKey}%`);
    }

    sql += ' ORDER BY occurrence_date DESC';
    const rows = db.prepare(sql).all(...params) as any[];

    const formattedRows = rows.map(r => ({
      date: r.occurrence_date,
      type: r.type,
      category: r.category,
      description: r.description,
      amount: centsToDollars(r.amount_cents).toFixed(2),
      notes: r.notes || '',
    }));

    return exportToCsv(formattedRows, [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount' },
      { key: 'notes', label: 'Notes' },
    ]);
  }

  static importCsv(userId: string, rows: CsvTransactionRow[]): { importedCount: number } {
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO transactions (id, user_id, amount_cents, type, category, occurrence_date, description, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: CsvTransactionRow[]) => {
      let count = 0;
      for (const item of items) {
        const id = uuidv4();
        const amountCents = dollarsToCents(item.amount);
        insertStmt.run(
          id,
          userId,
          amountCents,
          item.type,
          item.category,
          item.date,
          item.description,
          item.notes || null,
          now,
          now
        );
        count++;
      }
      return count;
    });

    const importedCount = insertMany(rows);
    return { importedCount };
  }
}
