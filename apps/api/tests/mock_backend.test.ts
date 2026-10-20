import { describe, it, expect, beforeEach, vi } from 'vitest';

// Polyfill localStorage in Node test environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) || null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Import mock backend
import { handleMockRequest } from '../../web/src/api/mockBackend';

describe('In-Browser Deterministic Engine & Standalone Vercel Mode', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Demo Workspace Initialization & Seeding', () => {
    it('initializes pre-seeded demo user and October 2026 ledger on demo login', async () => {
      const res = await handleMockRequest<any>('/auth/demo');
      expect(res.user).toBeDefined();
      expect(res.user.email).toBe('alex@finpilot.dev');
      expect(res.user.isDemo).toBe(true);
      expect(res.token).toBe('demo-token-alex-2026');

      // Verify token is stored in localStorage
      expect(localStorage.getItem('finpilot_token')).toBe('demo-token-alex-2026');
    });

    it('authenticates demo user with credentials', async () => {
      const res = await handleMockRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'alex@finpilot.dev', password: 'AnyPasswordWorksForDemo!' }),
      });
      expect(res.user.email).toBe('alex@finpilot.dev');
      expect(res.token).toBeDefined();
    });
  });

  describe('Deterministic Financial Calculations in Standalone Mode', () => {
    beforeEach(async () => {
      await handleMockRequest('/auth/demo');
    });

    it('returns exact October 2026 financial summary matching spec figures', async () => {
      const res = await handleMockRequest<any>('/analytics/summary?month=2026-10');
      const s = res.summary;

      // October seeded: Salary ($6,500) + Freelance ($1,400) = $7,900.00 (790,000 cents)
      expect(s.totalIncomeCents).toBe(790000);

      // Expenses seeded: 180000+24000+39500+22000+8500+13500+9500+14000+28500+30000 = 369,500 cents ($3,695.00)
      expect(s.totalExpenseCents).toBe(369500);

      // Net cash flow: 790,000 - 369,500 = 420,500 cents (+$4,205.00)
      expect(s.netCashFlowCents).toBe(420500);

      // Savings rate: (420,500 / 790,000) * 100 = 53.23%
      expect(s.savingsRatePercent).toBe(53.23);
    });

    it('returns sorted category breakdown with accurate percentage of expenses', async () => {
      const res = await handleMockRequest<any>('/analytics/categories?month=2026-10');
      expect(Array.isArray(res.breakdown)).toBe(true);
      expect(res.breakdown.length).toBeGreaterThan(0);

      // Verify sorted descending
      for (let i = 0; i < res.breakdown.length - 1; i++) {
        expect(res.breakdown[i].totalCents).toBeGreaterThanOrEqual(res.breakdown[i + 1].totalCents);
      }
    });

    it('calculates budget utilization, clamping, and detects over-budget categories', async () => {
      const res = await handleMockRequest<any>('/budgets?monthKey=2026-10');
      const budgets = res.budgets;
      expect(budgets.length).toBe(6);

      // Food budget: limit $500, spent $700 -> OVER BUDGET
      const foodBudget = budgets.find((b: any) => b.category === 'food');
      expect(foodBudget).toBeDefined();
      expect(foodBudget.status).toBe('over_budget');
      expect(foodBudget.remainingCents).toBeLessThan(0);
      expect(foodBudget.utilizationPercent).toBeGreaterThan(100);

      // Housing budget: limit $1,800, spent $1,800 -> NEAR LIMIT (100% utilization >= 85%)
      const housingBudget = budgets.find((b: any) => b.category === 'housing');
      expect(housingBudget).toBeDefined();
      expect(housingBudget.status).toBe('near_limit');
      expect(housingBudget.utilizationPercent).toBe(100);

      // Entertainment budget: limit $250, spent $140 -> ON TRACK (56% utilization < 85%)
      const entertainmentBudget = budgets.find((b: any) => b.category === 'entertainment');
      expect(entertainmentBudget).toBeDefined();
      expect(entertainmentBudget.status).toBe('on_track');
      expect(entertainmentBudget.utilizationPercent).toBe(56);
    });
  });

  describe('Full CRUD Operations in In-Browser Engine', () => {
    beforeEach(async () => {
      await handleMockRequest('/auth/demo');
    });

    it('creates, reads, updates, and deletes transactions dynamically', async () => {
      // 1. Create Transaction
      const createRes = await handleMockRequest<any>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amountCents: 9900,
          type: 'expense',
          category: 'shopping',
          occurrenceDate: '2026-10-20',
          description: 'Wireless Mouse',
        }),
      });
      const txId = createRes.transaction.id;
      expect(txId).toBeDefined();

      // 2. Read
      const listRes = await handleMockRequest<any>('/transactions?monthKey=2026-10&category=shopping');
      const found = listRes.transactions.find((t: any) => t.id === txId);
      expect(found).toBeDefined();
      expect(found.description).toBe('Wireless Mouse');

      // 3. Update
      const updateRes = await handleMockRequest<any>(`/transactions/${txId}`, {
        method: 'PUT',
        body: JSON.stringify({ description: 'Ergonomic Mouse' }),
      });
      expect(updateRes.transaction.description).toBe('Ergonomic Mouse');

      // 4. Delete
      const deleteRes = await handleMockRequest<any>(`/transactions/${txId}`, {
        method: 'DELETE',
      });
      expect(deleteRes.success).toBe(true);

      const checkList = await handleMockRequest<any>('/transactions?monthKey=2026-10&category=shopping');
      expect(checkList.transactions.find((t: any) => t.id === txId)).toBeUndefined();
    });

    it('exports sanitized CSV format from In-Browser Engine', async () => {
      const csv = await handleMockRequest<string>('/transactions/export?monthKey=2026-10');
      expect(typeof csv).toBe('string');
      expect(csv).toContain('"Description","Amount"');
      expect(csv).toContain('Luxury Apartment Rent');
    });
  });
});
