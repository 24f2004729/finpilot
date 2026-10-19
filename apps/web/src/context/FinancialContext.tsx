import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MonthlySummary,
  CategoryBreakdownItem,
  Budget,
  Transaction,
  SpendingInsight,
  formatMonthKey,
  getPreviousMonthKey,
  getNextMonthKey
} from '@finpilot/shared';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';

interface FinancialContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  summary: MonthlySummary | null;
  categories: CategoryBreakdownItem[];
  budgets: Budget[];
  recentTransactions: Transaction[];
  insights: SpendingInsight[];
  isLoading: boolean;
  invalidateQueries: () => Promise<void>;
  dismissInsight: (insightKey: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Default to October 2026 for rich seeded portfolio review, or current date if later
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdownItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFinancialData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [summaryRes, catRes, budgetRes, txRes, insightRes] = await Promise.all([
        apiRequest<{ summary: MonthlySummary }>(`/analytics/summary?month=${selectedMonth}`),
        apiRequest<{ breakdown: CategoryBreakdownItem[] }>(`/analytics/categories?month=${selectedMonth}`),
        apiRequest<{ budgets: Budget[] }>(`/budgets?monthKey=${selectedMonth}`),
        apiRequest<{ transactions: Transaction[] }>(`/transactions?monthKey=${selectedMonth}&limit=10`),
        apiRequest<{ insights: SpendingInsight[] }>(`/analytics/insights?month=${selectedMonth}`),
      ]);

      setSummary(summaryRes.summary);
      setCategories(catRes.breakdown);
      setBudgets(budgetRes.budgets);
      setRecentTransactions(txRes.transactions);
      setInsights(insightRes.insights);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Mandatory Chapter 08 Refresh Invalidation
  const invalidateQueries = useCallback(async () => {
    await fetchFinancialData();
  }, [fetchFinancialData]);

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth(prev => getPreviousMonthKey(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth(prev => getNextMonthKey(prev));
  }, []);

  const dismissInsight = useCallback(async (insightKey: string) => {
    try {
      await apiRequest('/analytics/insights/dismiss', {
        method: 'POST',
        body: JSON.stringify({ insightKey, monthKey: selectedMonth }),
      });
      setInsights(prev => prev.map(i => (i.id === insightKey ? { ...i, dismissed: true } : i)));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  }, [selectedMonth]);

  return (
    <FinancialContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        goToPrevMonth,
        goToNextMonth,
        summary,
        categories,
        budgets,
        recentTransactions,
        insights,
        isLoading,
        invalidateQueries,
        dismissInsight,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
