import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/db/database';

describe('End-to-End API Security & BOLA Isolation Suite', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let userATransactionId: string;
  let userABudgetId: string;

  const userAEmail = `user_a_${Date.now()}@test.com`;
  const userBEmail = `user_b_${Date.now()}@test.com`;
  const password = 'StrongPassword123!';

  beforeAll(async () => {
    // 1. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: userAEmail, password, fullName: 'Alice Architect' });
    expect(resA.status).toBe(201);
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // 2. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: userBEmail, password, fullName: 'Bob Builder' });
    expect(resB.status).toBe(201);
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  describe('System Health Probe (REQ-29-02)', () => {
    it('returns 200 and healthy database status on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Identity & Authentication Controls (REQ-18-01)', () => {
    it('rejects duplicate email registration with a clear message', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: userAEmail, password, fullName: 'Duplicate Alice' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns generic error on wrong password to prevent user enumeration', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userAEmail, password: 'WrongPassword999!' });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('authenticates valid credentials and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userAEmail, password });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(userAEmail);
    });

    it('supports 1-click instant demo login', async () => {
      const res = await request(app).post('/api/auth/demo');
      expect(res.status).toBe(200);
      expect(res.body.data.user.isDemo).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects requests without authentication token', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Broken Object-Level Authorization (BOLA/IDOR) Defense (REQ-18-02)', () => {
    it('allows User A to create a private transaction and budget', async () => {
      // Create Transaction
      const txRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          amountCents: 15000,
          type: 'expense',
          category: 'food',
          occurrenceDate: '2026-10-10',
          description: "Alice's Secret Lunch",
        });
      expect(txRes.status).toBe(201);
      userATransactionId = txRes.body.data.transaction.id;

      // Create Budget
      const bRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: 'food',
          monthKey: '2026-10',
          limitCents: 40000,
        });
      expect(bRes.status).toBe(201);
      userABudgetId = bRes.body.data.budget.id;
    });

    it('BLOCKED: User B cannot read User A transaction by ID (BOLA attack)', async () => {
      const res = await request(app)
        .get(`/api/transactions/${userATransactionId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('BLOCKED: User B cannot modify User A transaction (BOLA attack)', async () => {
      const res = await request(app)
        .put(`/api/transactions/${userATransactionId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ description: "Hacked by Bob" });
      expect(res.status).toBe(404);

      // Verify Alice's description remains intact
      const check = db.prepare('SELECT description FROM transactions WHERE id = ?').get(userATransactionId) as any;
      expect(check.description).toBe("Alice's Secret Lunch");
    });

    it('BLOCKED: User B cannot delete User A transaction (BOLA attack)', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${userATransactionId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);

      // Verify row still exists
      const check = db.prepare('SELECT id FROM transactions WHERE id = ?').get(userATransactionId);
      expect(check).toBeDefined();
    });

    it('BLOCKED: User B cannot see User A transactions in list or exports', async () => {
      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.transactions).toHaveLength(0);

      const exportRes = await request(app)
        .get('/api/transactions/export')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.text).not.toContain("Alice's Secret Lunch");
    });

    it('BLOCKED: User B cannot delete or access User A budget (BOLA attack)', async () => {
      const delRes = await request(app)
        .delete(`/api/budgets/${userABudgetId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(delRes.status).toBe(404);

      const listRes = await request(app)
        .get('/api/budgets?monthKey=2026-10')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.budgets).toHaveLength(0);
    });
  });

  describe('Budget Uniqueness & Actionable Error Copy (REQ-40-01)', () => {
    it('returns 409 with calm, actionable message when adding duplicate budget for same month/category', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: 'food',
          monthKey: '2026-10',
          limitCents: 50000,
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('BUDGET_ALREADY_EXISTS');
      expect(res.body.error.message).toContain('already has a budget for October');
    });
  });

  describe('Account Deletion & Data Control Cascade (REQ-19-03)', () => {
    it('rejects deletion if confirmation keyword is missing or incorrect', async () => {
      const res = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ confirmation: 'wrong' });
      expect(res.status).toBe(400);
    });

    it('permanently deletes user and cascades across transactions and budgets', async () => {
      const res = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ confirmation: 'DELETE' });
      expect(res.status).toBe(200);
      expect(res.body.data.deletedCounts.users).toBe(1);
      expect(res.body.data.deletedCounts.transactions).toBeGreaterThanOrEqual(1);
      expect(res.body.data.deletedCounts.budgets).toBeGreaterThanOrEqual(1);

      // Verify user no longer exists in database
      const checkUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userAId);
      expect(checkUser).toBeUndefined();

      // Verify transactions are wiped
      const checkTx = db.prepare('SELECT id FROM transactions WHERE user_id = ?').all(userAId);
      expect(checkTx).toHaveLength(0);
    });
  });
});
