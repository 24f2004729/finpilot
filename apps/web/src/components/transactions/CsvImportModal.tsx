import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiRequest } from '../../api/client';
import { UploadCloud, ShieldCheck, FileText } from 'lucide-react';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { invalidateQueries } = useFinancial();
  const [csvText, setCsvText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  function handleFileRead(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      setCsvText(e.target?.result as string);
    };
    reader.readAsText(file);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessCount(null);
    setIsSubmitting(true);

    try {
      if (!csvText.trim()) {
        throw new Error('Please select or paste CSV data to import.');
      }

      const res = await apiRequest<{ importedCount: number }>('/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      });

      setSuccessCount(res.importedCount);
      await invalidateQueries(); // Mandatory Chapter 08 Refresh Behavior
      setTimeout(() => {
        onClose();
        setCsvText('');
        setSuccessCount(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'CSV import failed.');
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
        setSuccessCount(null);
      }}
      title="Import Transactions (CSV)"
      description="Upload transaction records with automatic spreadsheet formula injection protection."
    >
      <form onSubmit={handleImport} className="space-y-4">
        {/* Security Notice (Chapter 18) */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Institutional Security Shield:</strong> All incoming records are sanitized against spreadsheet formula injection (CWE-1236) to prevent malicious macros in spreadsheet tools.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {successCount !== null && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-medium">
            ✅ Successfully imported {successCount} transaction{successCount === 1 ? '' : 's'}!
          </div>
        )}

        {/* Drag & Drop File Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Select CSV File
          </label>
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              id="csvFileInput"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileRead(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-200">
                Click to browse or drop CSV here
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Required columns: Date (YYYY-MM-DD), Description, Amount
              </span>
            </label>
          </div>
        </div>

        {/* Or Paste Raw Text */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Or Paste Raw CSV Text</span>
            <span className="text-[11px] text-slate-400">Header line required</span>
          </label>
          <textarea
            rows={4}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Date,Description,Category,Type,Amount&#10;2026-10-15,Whole Foods,food,expense,65.20"
            className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
            <FileText className="w-4 h-4 mr-1.5" />
            Parse & Import
          </Button>
        </div>
      </form>
    </Modal>
  );
};
