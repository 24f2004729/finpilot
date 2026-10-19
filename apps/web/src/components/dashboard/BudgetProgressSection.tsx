import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { SYSTEM_CATEGORIES, formatCurrency, formatMonthDisplay } from '@finpilot/shared';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { apiRequest } from '../../api/client';
import { Plus, Target, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export const BudgetProgressSection: React.FC = () => {
  const { budgets, selectedMonth, summary, invalidateQueries } = useFinancial();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(SYSTEM_CATEGORIES[0].id);
  const [limitAmount, setLimitAmount] = useState('500');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = summary?.currency || 'USD';

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedDollars = parseFloat(limitAmount);
      if (isNaN(parsedDollars) || parsedDollars <= 0) {
        throw new Error('Please enter a valid budget limit greater than zero.');
      }

      const limitCents = Math.round(parsedDollars * 100);

      await apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: selectedCategory,
          monthKey: selectedMonth,
          limitCents,
        }),
      });

      setIsAddModalOpen(false);
      setLimitAmount('500');
      await invalidateQueries(); // Mandatory Chapter 08 Refresh Behavior
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to establish budget.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Budget Target Progress
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spending relative to limits for {formatMonthDisplay(selectedMonth)}
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Set Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
            <Target className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">No Budgets Configured</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Establish category limits to track your target spending for {formatMonthDisplay(selectedMonth)}.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddModalOpen(true)}
          >
            Create First Budget
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {budgets.map(b => {
            const catDef = SYSTEM_CATEGORIES.find(c => c.id === b.category);
            const catName = catDef ? catDef.name : b.category;
            const isOverBudget = b.status === 'over_budget';
            const isNearLimit = b.status === 'near_limit';

            // Visual clamping at 100% per REQ-08-04 while preserving exact numbers
            const visualProgress = Math.min(Math.max(b.utilizationPercent, 0), 100);

            return (
              <div
                key={b.id}
                className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: catDef?.color || '#818CF8' }}
                    />
                    <span className="text-sm font-semibold text-slate-200">{catName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverBudget ? (
                      <Badge variant="danger" size="sm">
                        <AlertCircle className="w-3 h-3" />
                        Over budget
                      </Badge>
                    ) : isNearLimit ? (
                      <Badge variant="warning" size="sm">
                        <AlertTriangle className="w-3 h-3" />
                        Near limit
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        On track
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Visually Clamped at 100%) */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    style={{ width: `${visualProgress}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : isNearLimit
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Metric Semantics Display (Exact numbers preserved) */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-400">
                    <strong className="text-slate-200 font-mono">
                      {formatCurrency(b.spentCents, currency)}
                    </strong>{' '}
                    spent of{' '}
                    <span className="font-mono">{formatCurrency(b.limitCents, currency)}</span>{' '}
                    ({b.utilizationPercent.toFixed(1)}%)
                  </span>

                  <span
                    className={`font-mono font-medium ${
                      isOverBudget ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {isOverBudget
                      ? `${formatCurrency(Math.abs(b.remainingCents), currency)} over`
                      : `${formatCurrency(b.remainingCents, currency)} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Set Budget */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setErrorMsg(null);
        }}
        title="Set Category Budget"
        description={`Configure a target spending limit for ${formatMonthDisplay(selectedMonth)}.`}
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              {SYSTEM_CATEGORIES.filter(c => c.isExpense).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monthly Limit ($)"
            type="number"
            step="0.01"
            min="1"
            required
            value={limitAmount}
            onChange={e => setLimitAmount(e.target.value)}
            placeholder="500.00"
            hint="Exact monetary ceiling for this calendar month."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setErrorMsg(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
