import { SupportedCurrency } from './constants';

/**
 * Converts a standard decimal currency value (e.g. 120.50) to exact integer cents (12050).
 * Prevents floating point accumulation errors.
 */
export function dollarsToCents(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Converts integer cents (12050) back to standard floating decimal (120.50).
 */
export function centsToDollars(cents: number): number {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return cents / 100;
}

/**
 * Net cash flow equals income minus expenses.
 */
export function calculateNetCashFlow(incomeCents: number, expenseCents: number): number {
  return incomeCents - expenseCents;
}

/**
 * Savings rate formula according to Specification Ch 08:
 * (Net Cash Flow / Total Income) * 100%
 * If income is zero or negative, returns null to indicate that the formula would mislead.
 */
export function calculateSavingsRate(incomeCents: number, expenseCents: number): number | null {
  if (incomeCents <= 0) {
    return null;
  }
  const netFlow = calculateNetCashFlow(incomeCents, expenseCents);
  const rate = (netFlow / incomeCents) * 100;
  // Round to 2 decimal places deterministically
  return Math.round(rate * 100) / 100;
}

/**
 * Calculates budget progress metrics.
 * Preserves exact numeric amounts while clamping the visual bar at 100%.
 */
export function calculateBudgetUtilization(spentCents: number, limitCents: number): {
  remainingCents: number;
  utilizationPercent: number;
  visualClampPercent: number;
  status: 'on_track' | 'near_limit' | 'over_budget';
} {
  const remainingCents = limitCents - spentCents;
  const rawUtilization = limitCents > 0 ? (spentCents / limitCents) * 100 : 100;
  const utilizationPercent = Math.round(rawUtilization * 10) / 10;
  
  // Clamped at 100% for display progress bar
  const visualClampPercent = Math.min(Math.max(utilizationPercent, 0), 100);

  let status: 'on_track' | 'near_limit' | 'over_budget' = 'on_track';
  if (spentCents > limitCents) {
    status = 'over_budget';
  } else if (utilizationPercent >= 85) {
    status = 'near_limit';
  }

  return {
    remainingCents,
    utilizationPercent,
    visualClampPercent,
    status
  };
}

/**
 * Formats integer cents into standard localized currency string (e.g. $1,250.00).
 */
export function formatCurrency(cents: number, currency: SupportedCurrency = 'USD'): string {
  const dollars = centsToDollars(cents);
  const currencyLocales: Record<SupportedCurrency, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    INR: 'en-IN',
    AUD: 'en-AU'
  };

  const locale = currencyLocales[currency] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * Formats a Date object to YYYY-MM
 */
export function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Derives previous month key (e.g. "2026-10" -> "2026-09")
 */
export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Derives next month key (e.g. "2026-10" -> "2026-11")
 */
export function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Displays human-friendly month string (e.g. "October 2026")
 */
export function formatMonthDisplay(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
