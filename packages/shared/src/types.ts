import { TransactionType, SupportedCurrency } from './constants';

export interface User {
  id: string;
  email: string;
  fullName: string;
  currency: SupportedCurrency;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amountCents: number;
  type: TransactionType;
  category: string;
  occurrenceDate: string; // ISO YYYY-MM-DD
  description: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthKey: string; // ISO YYYY-MM
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  utilizationPercent: number;
  status: 'on_track' | 'near_limit' | 'over_budget';
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  totalIncomeCents: number;
  totalExpenseCents: number;
  netCashFlowCents: number;
  savingsRatePercent: number | null; // null if totalIncomeCents <= 0
  currency: SupportedCurrency;
}

export interface CategoryBreakdownItem {
  category: string;
  categoryName: string;
  color: string;
  totalCents: number;
  percentageOfExpenses: number;
  transactionCount: number;
}

export interface SpendingInsight {
  id: string;
  category: string;
  categoryName: string;
  monthKey: string;
  currentSpendCents: number;
  baselineSpendCents: number;
  percentageDifference: number;
  amountDifferenceCents: number;
  headline: string;
  explanation: string;
  dismissed: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface CsvTransactionRow {
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number; // In dollars/decimal
  notes?: string;
}
