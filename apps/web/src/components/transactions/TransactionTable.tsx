import React, { useState, useEffect, useCallback } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import {
  Transaction,
  SYSTEM_CATEGORIES,
  formatCurrency,
  formatMonthDisplay,
  TransactionType,
} from '@finpilot/shared';
import { apiRequest } from '../../api/client';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { AddTransactionModal } from './AddTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';
import { CsvImportModal } from './CsvImportModal';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';

export const TransactionTable: React.FC = () => {
  const { selectedMonth, summary, invalidateQueries } = useFinancial();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const currency = summary?.currency || 'USD';

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = `/transactions?monthKey=${selectedMonth}&page=${page}&limit=${pageSize}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (typeFilter) query += `&type=${typeFilter}`;
      if (searchTerm.trim()) query += `&search=${encodeURIComponent(searchTerm.trim())}`;

      const res = await apiRequest<{
        transactions: Transaction[];
        total: number;
        page: number;
        totalPages: number;
      }>(query);

      setTransactions(res.transactions);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, page, pageSize, categoryFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this transaction entry?')) return;
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
      await invalidateQueries(); // Mandatory Chapter 08 Refresh Behavior
      await fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction.');
    }
  }

  async function handleExportCsv() {
    try {
      const csvText = await apiRequest<string>(`/transactions/export?monthKey=${selectedMonth}`);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finpilot-${selectedMonth}-sanitized.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV.');
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Primary Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Financial Ledger & Transactions
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing entries for {formatMonthDisplay(selectedMonth)} • {totalCount} total entries
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5"
              title="Download sanitized CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <Input
            placeholder="Search description or notes..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            icon={<Search className="w-4 h-4" />}
          />

          <div>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {SYSTEM_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">All Flow Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No Transactions Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No transactions match your selected filter criteria for {formatMonthDisplay(selectedMonth)}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4">Description</th>
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4 text-right">Amount</th>
                  <th scope="col" className="py-3 px-4 text-center">Flow</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  const catDef = SYSTEM_CATEGORIES.find(c => c.id === tx.category);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {tx.occurrenceDate}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-100 block">{tx.description}</span>
                        {tx.notes && (
                          <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                            {tx.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: catDef?.color || '#94A3B8' }}
                          />
                          {catDef?.name || tx.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-sm">
                        <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amountCents, currency)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isIncome ? (
                          <Badge variant="success" size="sm">
                            <ArrowUpRight className="w-3 h-3" /> Income
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            <ArrowDownRight className="w-3 h-3" /> Expense
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page <strong className="text-slate-200">{page}</strong> of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          fetchTransactions();
        }}
      />

      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => {
          setEditingTransaction(null);
          fetchTransactions();
        }}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          fetchTransactions();
        }}
      />
    </div>
  );
};
