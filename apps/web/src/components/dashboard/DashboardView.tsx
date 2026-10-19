import React from 'react';
import { MetricsCards } from './MetricsCards';
import { SpendingInsightsCard } from './SpendingInsightsCard';
import { CategoryExpenseChart } from './CategoryExpenseChart';
import { BudgetProgressSection } from './BudgetProgressSection';
import { RecentTransactionsWidget } from './RecentTransactionsWidget';

export const DashboardView: React.FC<{ onNavigateToTransactions: () => void }> = ({
  onNavigateToTransactions,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards (Specification Chapter 08) */}
      <MetricsCards />

      {/* Non-judgmental Spending Insights (Specification Chapter 19 & 40) */}
      <SpendingInsightsCard />

      {/* Two-Column Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown Chart */}
        <CategoryExpenseChart />

        {/* Budget Progress & Targets */}
        <BudgetProgressSection />
      </div>

      {/* Recent Ledger Activity */}
      <RecentTransactionsWidget onNavigateToTransactions={onNavigateToTransactions} />
    </div>
  );
};
