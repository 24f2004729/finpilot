import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { SYSTEM_CATEGORIES, formatCurrency } from '@finpilot/shared';
import { Button } from '../common/Button';
import { Plus, ArrowRight, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { AddTransactionModal } from '../transactions/AddTransactionModal';

export const RecentTransactionsWidget: React.FC<{ onNavigateToTransactions: () => void }> = ({
  onNavigateToTransactions,
}) => {
  const { recentTransactions, summary } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currency = summary?.currency || 'USD';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Recent Activity
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Latest transactions recorded in this period
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigateToTransactions}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-100"
          >
            All Entries
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center">
          <p className="text-xs text-slate-400">No transactions recorded for this month.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setIsModalOpen(true)}
          >
            Log a Transaction
          </Button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-800/60">
          {recentTransactions.slice(0, 6).map(tx => {
            const isIncome = tx.type === 'income';
            const catDef = SYSTEM_CATEGORIES.find(c => c.id === tx.category);

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <span className="text-sm font-medium text-slate-200 block group-hover:text-emerald-400 transition-colors">
                      {tx.description}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {catDef?.name || tx.category} • {tx.occurrenceDate}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono text-sm font-semibold ${
                      isIncome ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amountCents, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
