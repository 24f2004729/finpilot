import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, SYSTEM_CATEGORIES, centsToDollars, TransactionType } from '@finpilot/shared';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { apiRequest } from '../../api/client';

export interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { invalidateQueries } = useFinancial();

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(centsToDollars(transaction.amountCents).toFixed(2));
      setDescription(transaction.description);
      setOccurrenceDate(transaction.occurrenceDate);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  if (!transaction) return null;

  const filteredCategories = SYSTEM_CATEGORIES.filter(c => (type === 'expense' ? c.isExpense : !c.isExpense));

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedDollars = parseFloat(amount);
      if (isNaN(parsedDollars) || parsedDollars <= 0) {
        throw new Error('Please enter a valid amount greater than zero.');
      }

      const amountCents = Math.round(parsedDollars * 100);

      await apiRequest(`/transactions/${transaction.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amountCents,
          type,
          category,
          occurrenceDate,
          description,
          notes: notes.trim() || null,
        }),
      });

      await invalidateQueries(); // Mandatory Chapter 08 Refresh Behavior
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setErrorMsg(null);
      }}
      title="Edit Transaction"
      description="Update ledger entry details."
    >
      <form onSubmit={handleUpdate} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('food');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('salary');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        <Input
          label="Description"
          required
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount ($)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Occurrence Date"
          type="date"
          required
          value={occurrenceDate}
          onChange={e => setOccurrenceDate(e.target.value)}
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              setErrorMsg(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Update Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
