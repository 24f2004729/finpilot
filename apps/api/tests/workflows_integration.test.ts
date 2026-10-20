import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('End-to-End Financial Workflows & Analytics Integration Suite', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `workflow_user_${Date.now()}@finpilot.dev`,
        password: 'FinancialPilot2026!',
        fullName: 'Morgan Stanley',
        currency: 'EUR',
      });
    expect(regRes.status).toBe(201);
    token = regRes.body.data.token;
    userId = regRes.body.data.user.id;
  });

  describe('Multi-Month Ledger Lifecycle & Cash Flow Analytics (REQ-08-01, REQ-08-02)', () => {
    it('seeds historical transactions across August, September, and October', async () => {
      // August 2026
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 500000, type: 'income', category: 'salary', occurrenceDate: '2026-08-01', description: 'Aug Salary' });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 150000, type: 'expense', category: 'housing', occurrenceDate: '2026-08-02', description: 'Aug Rent' });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 40000, type: 'expense', category: 'food', occurrenceDate: '2026-08-05', description: 'Aug Groceries' });

      // September 2026
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 500000, type: 'income', category: 'salary', occurrenceDate: '2026-09-01', description: 'Sep Salary' });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 150000, type: 'expense', category: 'housing', occurrenceDate: '2026-09-02', description: 'Sep Rent' });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 45000, type: 'expense', category: 'food', occurrenceDate: '2026-09-06', description: 'Sep Groceries' });

      // October 2026 (Active Month)
      const t1 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 600000, type: 'income', category: 'salary', occurrenceDate: '2026-10-01', description: 'Oct Salary' });
      expect(t1.status).toBe(201);

      const t2 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 100000, type: 'income', category: 'freelance', occurrenceDate: '2026-10-15', description: 'Consulting Gig' });
      expect(t2.status).toBe(201);

      const t3 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 150000, type: 'expense', category: 'housing', occurrenceDate: '2026-10-02', description: 'Oct Rent' });
      expect(t3.status).toBe(201);

      // Spend spike in food: $800.00 (vs avg ~$425.00)
      const t4 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 80000, type: 'expense', category: 'food', occurrenceDate: '2026-10-10', description: 'Team Banquets & Dining' });
      expect(t4.status).toBe(201);

      const t5 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 20000, type: 'expense', category: 'utilities', occurrenceDate: '2026-10-04', description: 'Fiber Internet' });
      expect(t5.status).toBe(201);
    });

    it('calculates monthly summary with accurate integer-cent arithmetic (REQ-08-01)', async () => {
      const res = await request(app)
        .get('/api/analytics/summary?month=2026-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;

      // Income: 600,000 + 100,000 = 700,000 cents ($7,000.00)
      expect(summary.totalIncomeCents).toBe(700000);
      // Expenses: 150,000 + 80,000 + 20,000 = 250,000 cents ($2,500.00)
      expect(summary.totalExpenseCents).toBe(250000);
      // Net Cash Flow: 700,000 - 250,000 = 450,000 cents ($4,500.00)
      expect(summary.netCashFlowCents).toBe(450000);
      // Savings Rate: (450,000 / 700,000) * 100 = 64.29%
      expect(summary.savingsRatePercent).toBe(64.29);
      expect(summary.currency).toBe('EUR');
    });

    it('returns sorted category breakdown with accurate percentage of expenses', async () => {
      const res = await request(app)
        .get('/api/analytics/categories?month=2026-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const breakdown = res.body.data.breakdown;
      expect(breakdown).toHaveLength(3);

      // Must be sorted deterministically by totalCents descending
      expect(breakdown[0].category).toBe('housing');
      expect(breakdown[0].totalCents).toBe(150000);
      expect(breakdown[0].percentageOfExpenses).toBe(60); // 1500 / 2500 = 60.0%

      expect(breakdown[1].category).toBe('food');
      expect(breakdown[1].totalCents).toBe(80000);
      expect(breakdown[1].percentageOfExpenses).toBe(32); // 800 / 2500 = 32.0%

      expect(breakdown[2].category).toBe('utilities');
      expect(breakdown[2].totalCents).toBe(20000);
      expect(breakdown[2].percentageOfExpenses).toBe(8); // 200 / 2500 = 8.0%
    });

    it('generates non-judgmental spending insights explaining baseline comparison (REQ-19-02, REQ-40-02)', async () => {
      const res = await request(app)
        .get('/api/analytics/insights?month=2026-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const insights = res.body.data.insights;

      // Food spending baseline was avg (40000 + 45000) / 2 = 42500 cents ($425.00)
      // Current spending is 80000 cents ($800.00), diff = +$375.00 (88% higher)
      const foodInsight = insights.find((i: any) => i.category === 'food');
      expect(foodInsight).toBeDefined();
      expect(foodInsight.percentageDifference).toBeGreaterThanOrEqual(20);
      expect(foodInsight.explanation).toContain('baseline average');
      expect(foodInsight.explanation).toContain('difference of +');
      expect(foodInsight.dismissed).toBe(false);

      // User dismisses insight
      const dismissRes = await request(app)
        .post('/api/analytics/insights/dismiss')
        .set('Authorization', `Bearer ${token}`)
        .send({ insightKey: foodInsight.id, monthKey: '2026-10' });
      expect(dismissRes.status).toBe(200);

      // Subsequent query marks insight dismissed
      const refetchRes = await request(app)
        .get('/api/analytics/insights?month=2026-10')
        .set('Authorization', `Bearer ${token}`);
      const updatedFoodInsight = refetchRes.body.data.insights.find((i: any) => i.category === 'food');
      expect(updatedFoodInsight.dismissed).toBe(true);
    });
  });

  describe('Dynamic Budget Utilization & Over-Budget Handling (REQ-08-04)', () => {
    let testBudgetId: string;

    it('creates budget and calculates real-time utilization against current transactions', async () => {
      // Set food budget limit to $500.00 (50,000 cents). Current spend is $800.00 (80,000 cents) -> OVER BUDGET
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'food',
          monthKey: '2026-10',
          limitCents: 50000,
        });

      expect(res.status).toBe(201);
      const b = res.body.data.budget;
      testBudgetId = b.id;
      expect(b.spentCents).toBe(80000);
      expect(b.remainingCents).toBe(-30000); // -$300.00
      expect(b.utilizationPercent).toBe(160);
      expect(b.status).toBe('over_budget');
    });

    it('updates budget limit dynamically updating utilization status to on_track', async () => {
      // Increase limit to $1,000.00 (100,000 cents). Spend remains $800.00 (80,000 cents) -> 80% ON TRACK
      const res = await request(app)
        .put(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ limitCents: 100000 });

      expect(res.status).toBe(200);
      const b = res.body.data.budget;
      expect(b.spentCents).toBe(80000);
      expect(b.remainingCents).toBe(20000); // +$200.00
      expect(b.utilizationPercent).toBe(80);
      expect(b.status).toBe('on_track');
    });

    it('deletes budget cleanly', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get('/api/budgets?monthKey=2026-10')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.body.data.budgets).toHaveLength(0);
    });
  });

  describe('CSV Import / Export Roundtrip & Data Portability (REQ-18-04, REQ-19-01)', () => {
    it('imports transactions in bulk from CSV payload', async () => {
      const csvPayload = [
        'Date,Description,Category,Type,Amount',
        '2026-10-18,Mechanical Keyboard,shopping,expense,150.00',
        '2026-10-19,Cloud Cert Exam,education,expense,300.00',
      ].join('\n');

      const res = await request(app)
        .post('/api/transactions/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText: csvPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.importedCount).toBe(2);

      // Verify transactions appear in list
      const listRes = await request(app)
        .get('/api/transactions?monthKey=2026-10')
        .set('Authorization', `Bearer ${token}`);
      const descriptions = listRes.body.data.transactions.map((t: any) => t.description);
      expect(descriptions).toContain('Mechanical Keyboard');
      expect(descriptions).toContain('Cloud Cert Exam');
    });

    it('exports sanitized CSV format compliant with RFC 4180', async () => {
      const res = await request(app)
        .get('/api/transactions/export?monthKey=2026-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('"Description","Amount"');
      expect(res.text).toContain('Mechanical Keyboard,150.00');
    });

    it('exports comprehensive user portfolio data archive via /api/user/export', async () => {
      const res = await request(app)
        .get('/api/user/export')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const exportData = res.body.data;
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.user.id).toBe(userId);
      expect(exportData.user.currency).toBe('EUR');
      expect(exportData.transactions.length).toBeGreaterThanOrEqual(5);
    });
  });
});
