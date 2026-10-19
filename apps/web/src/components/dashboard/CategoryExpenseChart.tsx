import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency } from '@finpilot/shared';
import { PieChart, List, AlertCircle } from 'lucide-react';

export const CategoryExpenseChart: React.FC = () => {
  const { categories, summary } = useFinancial();
  const [showTableView, setShowTableView] = useState(false);

  const currency = summary?.currency || 'USD';
  const hasExpenses = categories && categories.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Expense Breakdown by Category
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sorted deterministically descending by expenditure
          </p>
        </div>

        {hasExpenses && (
          <button
            onClick={() => setShowTableView(!showTableView)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
            aria-label="Toggle accessible tabular view"
          >
            <List className="w-3.5 h-3.5" />
            {showTableView ? 'Chart View' : 'Table View'}
          </button>
        )}
      </div>

      {!hasExpenses ? (
        // Empty State (Chapter 08: "If no expenses exist, show an empty state rather than a misleading blank chart.")
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">No Expenses Recorded</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            There are no expense transactions logged for this reporting month.
          </p>
        </div>
      ) : showTableView ? (
        // Accessible Tabular Text Equivalent
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300" aria-label="Category expenses table">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="py-2.5 px-3">Category</th>
                <th scope="col" className="py-2.5 px-3 text-right">Transactions</th>
                <th scope="col" className="py-2.5 px-3 text-right">Amount</th>
                <th scope="col" className="py-2.5 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categories.map(cat => (
                <tr key={cat.category} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.categoryName}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{cat.transactionCount}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200">
                    {formatCurrency(cat.totalCents, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{cat.percentageOfExpenses.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Visual Graphical Breakdown
        <div className="mt-5 space-y-4">
          {/* Stacked Proportional Bar */}
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex" title="Category distribution preview">
            {categories.map(cat => (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percentageOfExpenses}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full transition-all duration-500 hover:opacity-80"
                title={`${cat.categoryName}: ${cat.percentageOfExpenses.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Deterministic List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {categories.map(cat => (
              <div
                key={cat.category}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[140px]">
                      {cat.categoryName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {cat.transactionCount} {cat.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-slate-100 block">
                    {formatCurrency(cat.totalCents, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {cat.percentageOfExpenses.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
