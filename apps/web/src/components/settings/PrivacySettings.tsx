import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { apiRequest } from '../../api/client';
import { Shield, Download, Trash2, CheckCircle2, Lock, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleExportJson() {
    setIsExporting(true);
    try {
      const data = await apiRequest<any>('/user/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finpilot-export-${user?.id.substring(0, 8)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to export account data.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await apiRequest('/user/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      alert('Your account and all associated transactions and budgets have been permanently wiped.');
      await logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-400" />
          Privacy, Security & Data Sovereignty
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Institutional standards for data minimization, log redaction, and user autonomy.
        </p>
      </div>

      {/* Data Minimization Statement (Chapter 19) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Data Minimization & Log Hygiene (Specification Chapter 19)
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          FinPilot adheres strictly to the principle of financial data minimization. Unlike aggressive aggregator services:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-slate-200 block">No Bank Login Credentials</strong>
              <span className="text-slate-400">We never ask for online banking credentials, card numbers, or government IDs.</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-slate-200 block">Zero Plaintext Log Storage</strong>
              <span className="text-slate-400">All passwords, bearer tokens, cookies, and descriptions are redacted from system logs.</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Data Export (Chapter 19) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            Export Complete Financial History
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Download a portable, machine-readable JSON archive containing your user profile, all categorized transactions, and configured monthly budgets.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportJson}
          isLoading={isExporting}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export JSON Archive
        </Button>
      </div>

      {/* Danger Zone: Account Deletion (Chapter 19) */}
      <div className="bg-slate-900 border border-rose-950/60 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Permanent Account & Data Wipe
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Permanently delete your account. This cascades immediately across all transaction ledgers, budget entries, insights, and session tokens.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setIsDeleteModalOpen(true);
            setDeleteConfirmation('');
            setDeleteError(null);
          }}
          className="flex-shrink-0"
        >
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
        description="This action cannot be undone. All your financial records will be permanently purged."
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>
              All stored records for <strong>{user?.email}</strong> will be immediately dropped from the database.
            </span>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-xs text-rose-300">
              {deleteError}
            </div>
          )}

          <Input
            label="Type 'DELETE' to confirm"
            required
            value={deleteConfirmation}
            onChange={e => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={deleteConfirmation !== 'DELETE'}
              isLoading={isDeleting}
            >
              Permanently Wipe Data
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
