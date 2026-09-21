import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AppDataPayload, saveToCloudData } from '../services/firebaseSync';
import { parseMultipleBackupFiles } from '../services/backupParser';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: AppDataPayload;
  onRestoreData: (restoredData: AppDataPayload) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onRestoreData,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export Data to JSON File
  const handleDownloadBackup = () => {
    try {
      const dataStr = JSON.stringify(currentData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Trendz_Accounts_Backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Backup downloaded successfully! (${currentData.invoices?.length || 0} invoices, ${currentData.banks?.length || 0} banks, ${currentData.customers?.length || 0} customers preserved).`,
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to generate backup file.',
      });
    }
  };

  // 2. Import Data from JSON File(s)
  const handleProcessFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const { mergedData, summary } = await parseMultipleBackupFiles(files, currentData);

      // Apply to local and save to cloud
      onRestoreData(mergedData);
      await saveToCloudData(mergedData);

      const parts: string[] = [];
      if (summary.invoices > 0) parts.push(`${summary.invoices} invoices`);
      if (summary.banks > 0) parts.push(`${summary.banks} banks`);
      if (summary.bankTransactions > 0) parts.push(`${summary.bankTransactions} bank entries`);
      if (summary.customers > 0) parts.push(`${summary.customers} customers`);
      if (summary.vendors > 0) parts.push(`${summary.vendors} vendors`);
      if (summary.products > 0) parts.push(`${summary.products} products`);
      if (summary.receipts > 0) parts.push(`${summary.receipts} receipt memos`);
      if (summary.officeExpenses > 0) parts.push(`${summary.officeExpenses} office expenses`);

      const summaryStr = parts.length > 0 ? parts.join(', ') : 'records';

      setStatusMessage({
        type: 'success',
        text: `Successfully restored ${summary.fileCount} file(s)! Loaded ${summaryStr} & synced to cloud.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error reading or parsing the backup JSON file(s).',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white m-0">Data Backup & Restore</h3>
              <p className="text-xs text-slate-400 m-0">Protect, download, or restore your company accounts data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Counts Summary */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center text-xs">
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="block text-[11px] text-slate-400">Invoices</span>
              <span className="text-sm font-bold text-white">{currentData.invoices?.length || 0}</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="block text-[11px] text-slate-400">Banks</span>
              <span className="text-sm font-bold text-white">{currentData.banks?.length || 0}</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="block text-[11px] text-slate-400">Customers</span>
              <span className="text-sm font-bold text-white">{currentData.customers?.length || 0}</span>
            </div>
          </div>

          {/* Action 1: Download Backup */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white flex items-center gap-1.5 m-0">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Backup File
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                  Save all accounts, invoices, expenses, and bank records to a file on your PC.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <FileJson className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Action 2: Restore Backup */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white flex items-center gap-1.5 m-0">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Restore from Backup File
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                  Select a previously downloaded backup file to restore all records.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="restore-file-input"
            />

            {/* Drag and Drop or Browse Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleProcessFiles(e.dataTransfer.files);
                }
              }}
              className="mt-2 p-3 border-2 border-dashed border-slate-600 hover:border-blue-400 rounded-lg bg-slate-900/40 text-center cursor-pointer transition-colors"
            >
              <FileJson className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-300 font-medium m-0">Click here or drag & drop backup .JSON file(s)</p>
              <p className="text-[10px] text-slate-400 mt-0.5 m-0">Supports single or all backup files (hold Ctrl to select multiple)</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restoring Selected Files...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Browse PC & Restore File(s)</span>
                </>
              )}
            </button>
          </div>

          {/* Cloud Auto-Sync Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>All records are also protected in real time in your Google Firebase Cloud.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
