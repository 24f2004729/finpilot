import { describe, it, expect } from 'vitest';
import {
  calculateNetCashFlow,
  calculateSavingsRate,
  calculateBudgetUtilization,
  dollarsToCents,
  centsToDollars,
} from '@finpilot/shared';

describe('Financial Calculation Engine (Specification Chapter 08)', () => {
  describe('Currency & Cent Precision (ADR-002)', () => {
    it('converts floating point dollars to exact integer cents without drift', () => {
      expect(dollarsToCents(120.50)).toBe(12050);
      expect(dollarsToCents(0.10 + 0.20)).toBe(30); // 0.30000000000000004 -> 30 cents
      expect(dollarsToCents(99.99)).toBe(9999);
      expect(dollarsToCents(0)).toBe(0);
    });

    it('converts integer cents back to decimal dollars', () => {
      expect(centsToDollars(12050)).toBe(120.5);
      expect(centsToDollars(30)).toBe(0.3);
      expect(centsToDollars(0)).toBe(0);
    });
  });

  describe('Net Cash Flow Semantics (REQ-08-01)', () => {
    it('calculates net cash flow as total income minus total expenses', () => {
      const incomeCents = 500000; // $5,000.00
      const expenseCents = 320000; // $3,200.00
      expect(calculateNetCashFlow(incomeCents, expenseCents)).toBe(180000); // $1,800.00
    });

    it('handles negative net cash flow when expenses exceed income', () => {
      const incomeCents = 200000; // $2,000.00
      const expenseCents = 250000; // $2,500.00
      expect(calculateNetCashFlow(incomeCents, expenseCents)).toBe(-50000); // -$500.00
    });
  });

  describe('Savings Rate Semantics & Edge Cases (REQ-08-02)', () => {
    it('calculates savings rate percentage accurately for positive income', () => {
      const incomeCents = 1000000; // $10,000.00
      const expenseCents = 600000; // $6,000.00
      // Net flow: $4,000.00. Rate: (4000 / 10000) * 100 = 40%
      expect(calculateSavingsRate(incomeCents, expenseCents)).toBe(40);
    });

    it('returns null when income is zero to prevent misleading infinity/NaN', () => {
      expect(calculateSavingsRate(0, 50000)).toBeNull();
    });

    it('returns null when income is negative to prevent misleading calculation', () => {
      expect(calculateSavingsRate(-1000, 50000)).toBeNull();
    });

    it('calculates negative savings rate when expenses exceed positive income', () => {
      const incomeCents = 100000; // $1,000.00
      const expenseCents = 150000; // $1,500.00
      // Net flow: -$500.00. Rate: (-500 / 1000) * 100 = -50%
      expect(calculateSavingsRate(incomeCents, expenseCents)).toBe(-50);
    });
  });

  describe('Budget Progress & Clamping Semantics (REQ-08-04)', () => {
    it('calculates on_track status for spend below 85% utilization', () => {
      const result = calculateBudgetUtilization(40000, 100000); // $400 of $1,000
      expect(result.remainingCents).toBe(60000);
      expect(result.utilizationPercent).toBe(40);
      expect(result.visualClampPercent).toBe(40);
      expect(result.status).toBe('on_track');
    });

    it('calculates near_limit status for spend between 85% and 100% utilization', () => {
      const result = calculateBudgetUtilization(88000, 100000); // $880 of $1,000
      expect(result.remainingCents).toBe(12000);
      expect(result.utilizationPercent).toBe(88);
      expect(result.visualClampPercent).toBe(88);
      expect(result.status).toBe('near_limit');
    });

    it('clamps visual progress at 100% while preserving exact negative remaining and over_budget status', () => {
      const result = calculateBudgetUtilization(140000, 100000); // $1,400 spent of $1,000 limit
      expect(result.remainingCents).toBe(-40000); // -$400.00
      expect(result.utilizationPercent).toBe(140);
      expect(result.visualClampPercent).toBe(100); // Visually clamped at 100% max fill
      expect(result.status).toBe('over_budget');
    });
  });
});
