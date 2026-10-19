import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Info } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency } from '@finpilot/shared';

export const MetricsCards: React.FC = () => {
  const { summary } = useFinancial();

  const incomeCents = summary?.totalIncomeCents || 0;
  const expenseCents = summary?.totalExpenseCents || 0;
  const netCashFlowCents = summary?.netCashFlowCents || 0;
  const savingsRate = summary?.savingsRatePercent;
  const currency = summary?.currency || 'USD';

  const isPositiveNetFlow = netCashFlowCents >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Income Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Total Income</span>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {formatCurrency(incomeCents, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sum of income transactions
          </p>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Total Expenses</span>
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {formatCurrency(expenseCents, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sum of expense transactions
          </p>
        </div>
      </div>

      {/* Net Cash Flow Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Net Cash Flow</span>
          <div className={`p-2 rounded-xl border ${isPositiveNetFlow ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold font-mono tracking-tight ${isPositiveNetFlow ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveNetFlow ? '+' : ''}{formatCurrency(netCashFlowCents, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Income minus expenses
          </p>
        </div>
      </div>

      {/* Savings Rate Card (Specification Chapter 08) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-wider uppercase">Savings Rate</span>
            <span title="Formula: (Net Cash Flow / Total Income) × 100%. Hidden if income is zero." className="cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            {savingsRate !== null && savingsRate !== undefined ? (
              `${savingsRate.toFixed(1)}%`
            ) : (
              <span className="text-slate-400 font-normal" title="No income recorded this month">
                —
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {savingsRate !== null && savingsRate !== undefined
              ? 'Percent of monthly income saved'
              : 'Undefined (income is zero)'}
          </p>
        </div>
      </div>
    </div>
  );
};
