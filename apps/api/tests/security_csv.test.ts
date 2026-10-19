import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, exportToCsv, parseCsvSafe } from '@finpilot/shared';

describe('CSV Security & Formula Injection Defense (Chapter 18 & ADR-003)', () => {
  describe('Formula Injection Sanitization (CWE-1236)', () => {
    it('prepends an apostrophe to dangerous leading formula triggers', () => {
      // Excel/Sheets formula execution triggers
      expect(sanitizeCsvCell('=cmd|\' /C calc\'!A0')).toBe('\'=cmd|\' /C calc\'!A0');
      expect(sanitizeCsvCell('+1+2')).toBe('\'+1+2');
      expect(sanitizeCsvCell('-50.00')).toBe('\'-50.00');
      expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe('\'@SUM(A1:A10)');
      expect(sanitizeCsvCell('\tDDE("cmd";"calc";"")')).toBe('"\'\tDDE(""cmd"";""calc"";"""")"');
      expect(sanitizeCsvCell('\tDDE')).toBe('\'\tDDE');
    });

    it('leaves standard harmless alphanumeric financial descriptions untouched', () => {
      expect(sanitizeCsvCell('Whole Foods Groceries')).toBe('Whole Foods Groceries');
      expect(sanitizeCsvCell('TechCorp Salary Payout')).toBe('TechCorp Salary Payout');
      expect(sanitizeCsvCell('12345')).toBe('12345');
    });

    it('escapes cells containing commas and quotes per RFC 4180', () => {
      expect(sanitizeCsvCell('Coffee, Tea & Snacks')).toBe('"Coffee, Tea & Snacks"');
      expect(sanitizeCsvCell('Consulting "Special" Project')).toBe('"Consulting ""Special"" Project"');
    });
  });

  describe('Full CSV Serialization', () => {
    it('correctly serializes and sanitizes rows into CSV format', () => {
      const rows = [
        { desc: 'Regular Dinner', amount: '45.00' },
        { desc: '=2+5', amount: '7.00' },
        { desc: 'Safe Item, with comma', amount: '12.50' },
      ];

      const csv = exportToCsv(rows, [
        { key: 'desc', label: 'Description' },
        { key: 'amount', label: 'Amount' },
      ]);

      const lines = csv.split('\r\n');
      expect(lines[0]).toBe('"Description","Amount"');
      expect(lines[1]).toBe('Regular Dinner,45.00');
      expect(lines[2]).toBe('\'=2+5,7.00');
      expect(lines[3]).toBe('"Safe Item, with comma",12.50');
    });
  });

  describe('Safe CSV Parsing', () => {
    it('parses valid CSV rows into structured transactions', () => {
      const csvText = `Date,Description,Category,Type,Amount\n2026-10-15,Supermarket,food,expense,125.50\n2026-10-16,Bonus,salary,income,500.00`;
      const result = parseCsvSafe(csvText);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2026-10-15',
        description: 'Supermarket',
        category: 'food',
        type: 'expense',
        amount: 125.5,
        notes: undefined,
      });
      expect(result[1]).toEqual({
        date: '2026-10-16',
        description: 'Bonus',
        category: 'salary',
        type: 'income',
        amount: 500,
        notes: undefined,
      });
    });

    it('throws error when mandatory columns are missing', () => {
      const badCsv = `RandomCol,AnotherCol\nFoo,Bar`;
      expect(() => parseCsvSafe(badCsv)).toThrow('CSV must contain Date, Description, and Amount columns.');
    });
  });
});
