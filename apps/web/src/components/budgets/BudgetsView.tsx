import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { SYSTEM_CATEGORIES, formatCurrency, formatMonthDisplay } from '@finpilot/shared';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { apiRequest } from '../../api/client';
import { Target, Plus, AlertCircle, AlertTriangle, CheckCircle2, Edit2, Trash2, PieChart } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { budgets, selectedMonth, summary, invalidateQueries } = useFinancial();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ id: string; category: string; limitDollars: string } | null>(null);

  const [category, setCategory] = useState('food');
  const [limitDollars, setLimitDollars] = useState('500');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = summary?.currency || 'USD';

  // Overall totals across all budgets
  const totalBudgetLimitCents = budgets.reduce((acc, b) => acc + b.limitCents, 0);
  const totalBudgetSpentCents = budgets.reduce((acc, b) => acc + b.spentCents, 0);
  const overallUtilization = totalBudgetLimitCents > 0 ? (totalBudgetSpentCents / totalBudgetLimitCents) * 100 : 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const parsed = parseFloat(limitDollars);
      if (isNaN(parsed) || parsed <= 0) throw new Error('Enter a valid budget limit.');

      await apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category,
          monthKey: selectedMonth,
          limitCents: Math.round(parsed * 100),
        }),
      });

      setIsAddOpen(false);
      await invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create budget.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBudget) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const parsed = parseFloat(editingBudget.limitDollars);
      if (isNaN(parsed) || parsed <= 0) throw new Error('Enter a valid budget limit.');

      await apiRequest(`/budgets/${editingBudget.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          limitCents: Math.round(parsed * 100),
        }),
      });

      setEditingBudget(null);
      await invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update budget.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await apiRequest(`/budgets/${id}`, { method: 'DELETE' });
      await invalidateQueries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete budget.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Target className="w-5 h-5 text-indigo-400" />
              Budget Targets & Discipline
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured monthly caps for {formatMonthDisplay(selectedMonth)}
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Set Category Budget
          </Button>
        </div>

        {/* Overall Summary Bar */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
              Total Budgeted Limit
            </span>
            <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
              {formatCurrency(totalBudgetLimitCents, currency)}
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
              Actual Spend in Budgeted Categories
            </span>
            <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
              {formatCurrency(totalBudgetSpentCents, currency)}
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
              Overall Utilization
            </span>
            <span className={`text-xl font-bold font-mono mt-1 block ${overallUtilization > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overallUtilization.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Budgets */}
      {budgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">No Category Budgets Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Setting monthly budget limits helps monitor your spending cadence and detect unexpected outflows.
          </p>
          <Button size="sm" variant="primary" className="mt-4" onClick={() => setIsAddOpen(true)}>
            Set First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const catDef = SYSTEM_CATEGORIES.find(c => c.id === b.category);
            const isOver = b.status === 'over_budget';
            const isNear = b.status === 'near_limit';
            const visualProgress = Math.min(Math.max(b.utilizationPercent, 0), 100);

            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: catDef?.color || '#818CF8' }}
                    />
                    <h3 className="text-sm font-semibold text-slate-100">
                      {catDef?.name || b.category}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOver ? (
                      <Badge variant="danger" size="sm">
                        <AlertCircle className="w-3 h-3" />
                        Over budget
                      </Badge>
                    ) : isNear ? (
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

                {/* Progress bar clamped at 100% */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${visualProgress}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{b.utilizationPercent.toFixed(1)}% utilized</span>
                    <span className={isOver ? 'text-rose-400 font-medium' : ''}>
                      {isOver
                        ? `${formatCurrency(Math.abs(b.remainingCents), currency)} over`
                        : `${formatCurrency(b.remainingCents, currency)} left`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Spent / Limit</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {formatCurrency(b.spentCents, currency)} / {formatCurrency(b.limitCents, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setEditingBudget({
                          id: b.id,
                          category: b.category,
                          limitDollars: (b.limitCents / 100).toFixed(2),
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Limit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setErrorMsg(null);
        }}
        title="Set Category Budget"
        description={`Configure a limit for ${formatMonthDisplay(selectedMonth)}.`}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
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
            value={limitDollars}
            onChange={e => setLimitDollars(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddOpen(false);
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

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingBudget)}
        onClose={() => {
          setEditingBudget(null);
          setErrorMsg(null);
        }}
        title="Update Budget Limit"
        description="Change your spending ceiling for this category."
      >
        {editingBudget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <Input
              label="New Monthly Limit ($)"
              type="number"
              step="0.01"
              min="1"
              required
              value={editingBudget.limitDollars}
              onChange={e =>
                setEditingBudget({ ...editingBudget, limitDollars: e.target.value })
              }
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingBudget(null);
                  setErrorMsg(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
