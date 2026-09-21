import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Clock,
  Sparkles,
  Cloud
} from 'lucide-react';
import { AppDataPayload, saveToCloudData } from '../services/firebaseSync';
import {
  parseMultipleBackupFiles,
  extractDataFromObject,
  mergeAppData,
} from '../services/backupParser';

interface BackupRestoreViewProps {
  currentData: AppDataPayload;
  onRestoreData: (restoredData: AppDataPayload) => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime?: string | null;
  onForceSync?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  currentData,
  onRestoreData,
  cloudSyncStatus = 'synced',
  lastSyncTime,
  onForceSync,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topAlertRef = useRef<HTMLDivElement>(null);

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
        text: `Backup downloaded successfully! Preserved ${currentData.invoices?.length || 0} invoices, ${currentData.banks?.length || 0} banks, ${currentData.customers?.length || 0} customers, and all expense records to your computer.`,
      });
      topAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      // Apply to local application state & persist immediately
      onRestoreData(mergedData);

      // Sync to Google Cloud
      await saveToCloudData(mergedData);

      const parts: string[] = [];
      if (summary.invoices > 0) parts.push(`${summary.invoices} invoices`);
      if (summary.banks > 0) parts.push(`${summary.banks} banks`);
      if (summary.bankTransactions > 0) parts.push(`${summary.bankTransactions} bank entries`);
      if (summary.customers > 0) parts.push(`${summary.customers} customers`);
      if (summary.vendors > 0) parts.push(`${summary.vendors} vendors`);
      if (summary.products > 0) parts.push(`${summary.products} products`);
      if (summary.receipts > 0) parts.push(`${summary.receipts} receipts`);
      if (summary.officeExpenses > 0) parts.push(`${summary.officeExpenses} office expenses`);
      if (summary.projects > 0) parts.push(`${summary.projects} projects`);
      if (summary.projectExpenses > 0) parts.push(`${summary.projectExpenses} site expenses`);

      const summaryStr = parts.length > 0 ? parts.join(', ') : 'All account records';

      setStatusMessage({
        type: 'success',
        text: `Success! Restored and uploaded to Google Cloud: ${summaryStr}. Check Invoices or Bank tabs now!`,
      });
      topAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error reading or parsing the uploaded file(s).',
      });
      topAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Database className="w-7 h-7 text-blue-600" />
            <span>Data Backup & Safe Storage</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Synchronize your data from your browser directly into this preview, or download an offline backup anytime.
          </p>
        </div>

        {onForceSync && (
          <button
            onClick={onForceSync}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${cloudSyncStatus === 'syncing' ? 'animate-spin text-white' : ''}`} />
            <span>Sync with Cloud Now</span>
          </button>
        )}
      </div>

      {/* QUICK BROWSER DATA RESTORE BANNER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md border border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300 shrink-0">
            <Sparkles className="w-7 h-7 text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white m-0">
              Restore Data Directly from Your Browser to Preview
            </h3>
            <p className="text-xs text-blue-200 mt-1 leading-relaxed">
              If your entries are saved in your live browser or another tab, you can transfer them into this preview in 2 simple steps without downloading any files:
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 Box */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                  Step 1 • On Your App Browser Tab
                </span>
                <p className="text-xs text-slate-200 mb-3">
                  Open your other tab where you typed your entries, press <strong>F12</strong> (or right-click ➔ Inspect), click <strong>Console</strong>, paste this code, and press <strong>Enter</strong>:
                </p>
                <div className="relative">
                  <pre className="bg-black/50 p-2.5 rounded-lg text-[11px] text-emerald-300 font-mono overflow-x-auto select-all border border-white/10">
copy(JSON.stringify(localStorage))
                  </pre>
                </div>
                <span className="text-[10px] text-blue-200/80 block mt-1.5">
                  (This automatically copies all your typed entries into your clipboard!)
                </span>
              </div>

              {/* Step 2 Box */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                    Step 2 • Paste Here into Preview
                  </span>
                  <p className="text-xs text-slate-200 mb-2">
                    Paste right into this box and click <strong>"Import into Preview"</strong>:
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    id="browser-export-paste-box"
                    rows={3}
                    placeholder="Paste copied text here (Ctrl + V)..."
                    className="w-full text-xs p-2.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-mono border border-slate-300"
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById('browser-export-paste-box') as HTMLTextAreaElement;
                      if (!input || !input.value.trim()) {
                        setStatusMessage({ type: 'error', text: 'Please paste the text into the box first.' });
                        return;
                      }
                      try {
                        const inputVal = input.value.trim();
                        const extracted = extractDataFromObject(inputVal);

                        const hasAny =
                          (extracted.invoices && extracted.invoices.length > 0) ||
                          (extracted.banks && extracted.banks.length > 0) ||
                          (extracted.customers && extracted.customers.length > 0) ||
                          (extracted.vendors && extracted.vendors.length > 0) ||
                          (extracted.officeExpenses && extracted.officeExpenses.length > 0) ||
                          (extracted.products && extracted.products.length > 0) ||
                          (extracted.receipts && extracted.receipts.length > 0) ||
                          Boolean(extracted.masterPassword);

                        if (!hasAny) {
                          throw new Error('Could not find recognizable accounting data in the pasted text.');
                        }

                        const dataToRestore = mergeAppData(currentData, extracted);

                        onRestoreData(dataToRestore);
                        await saveToCloudData(dataToRestore);
                        input.value = '';
                        setStatusMessage({
                          type: 'success',
                          text: `All entries restored successfully! Restored ${dataToRestore.invoices?.length || 0} invoices and ${dataToRestore.banks?.length || 0} banks into this preview and synced with Google Cloud.`,
                        });
                      } catch (err: any) {
                        console.error(err);
                        setStatusMessage({
                          type: 'error',
                          text: `Could not read data: ${err?.message || 'Invalid format'}. Please ensure you ran copy(JSON.stringify(localStorage)) on your other tab.`,
                        });
                      }
                    }}
                    className="py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-sm self-end"
                  >
                    Import into Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      <div ref={topAlertRef}>
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed shadow-md animate-bounce-short ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300'
                : 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-base">{statusMessage.type === 'success' ? '✓ Data Uploaded & Synced Successfully!' : 'Notice'}</p>
              <p className="mt-1 text-sm font-medium">{statusMessage.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cloud & Local Live Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Cloud Sync Status</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              {cloudSyncStatus === 'synced' ? 'Connected & Live' : 'Synchronizing...'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {lastSyncTime ? `Last synced at ${lastSyncTime}` : 'Google Firebase'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Registered Invoices</span>
            <span className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {currentData.invoices?.length || 0}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Commercial billings</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Bank Accounts & Ledgers</span>
            <span className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {currentData.banks?.length || 0}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {currentData.bankTransactions?.length || 0} total bank entries
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Expenses & Parties</span>
            <span className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {(currentData.officeExpenses?.length || 0) + (currentData.projectExpenses?.length || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {currentData.customers?.length || 0} customers, {currentData.vendors?.length || 0} vendors
            </span>
          </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: DOWNLOAD BACKUP */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 m-0">1. Download Backup File</h3>
                <p className="text-xs text-slate-500 m-0">Export all company records to a file on your PC</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Downloads a single, human-readable file containing your entire accounting system — including every customer, invoice, bank balance, payment receipt memo, office expense, and project sheet.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero data loss guarantee — saves directly to your computer</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Can be kept as weekly or monthly accounting backup archives</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Safe to keep offline before making any major system updates</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <FileJson className="w-5 h-5" />
              <span>Download Complete Backup (.JSON)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: RESTORE BACKUP */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 m-0">2. Restore from Backup File</h3>
                <p className="text-xs text-slate-500 m-0">Load previous records from your saved backup</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              If you ever change laptops, wipe browser history, or want to restore records to another computer or Netlify URL, simply pick your backup file here.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Instant restore for all invoices, banks, customers, and expenses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Automatically syncs the restored data to your Google Firebase Cloud</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Validates file integrity before applying changes</span>
              </li>
            </ul>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop or Click Upload Area */}
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
              className="mt-4 p-5 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-center cursor-pointer transition-colors"
            >
              <FileJson className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-blue-900">
                Click here or drag & drop backup .JSON file(s)
              </p>
              <p className="text-xs text-blue-700/70 mt-1">
                Supports single or all backup files (hold Ctrl/Shift to pick multiple files at once)
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Restoring All Selected Files...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Browse PC & Restore File(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Option 3: Quick Copy/Paste Data Transfer (No file download needed) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 m-0">3. Direct Copy & Paste Sync (No File Required)</h3>
            <p className="text-xs text-slate-500 m-0">
              Transfer your data directly between browsers or tabs using simple Copy & Paste
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Step A: On the Browser with Your Entries</p>
              <p className="text-xs text-slate-500 mt-1">
                Click this button to copy all your company data directly into your computer clipboard:
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
                setStatusMessage({
                  type: 'success',
                  text: 'All account data copied to clipboard! Now switch to your other browser or preview and paste it below.',
                });
              }}
              className="mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <span>Copy Entire Data to Clipboard</span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Step B: Paste & Apply Data Here</p>
              <p className="text-xs text-slate-500 mt-1">
                Paste the copied data into this box and click "Apply Pasted Data":
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                id="direct-sync-paste-input"
                placeholder="Paste copied data here (Ctrl + V)..."
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={async () => {
                  const input = document.getElementById('direct-sync-paste-input') as HTMLInputElement;
                  if (!input || !input.value.trim()) {
                    setStatusMessage({ type: 'error', text: 'Please paste your data text into the box first.' });
                    return;
                  }
                  try {
                    const parsed = JSON.parse(input.value.trim()) as AppDataPayload;
                    if (!parsed.invoices && !parsed.banks && !parsed.customers) {
                      throw new Error('Invalid format.');
                    }
                    onRestoreData(parsed);
                    await saveToCloudData(parsed);
                    input.value = '';
                    setStatusMessage({
                      type: 'success',
                      text: `Data successfully synchronized! Loaded ${parsed.invoices?.length || 0} invoices & ${parsed.banks?.length || 0} banks.`,
                    });
                  } catch {
                    setStatusMessage({ type: 'error', text: 'Invalid data pasted. Make sure you copied the full data.' });
                  }
                }}
                className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Protection Guarantee Note */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          <strong>Real-Time Cloud Protection Active:</strong> Once synchronized, all your entries are continuously linked to your Google Cloud Firestore database (`ai-studio-accountinghubexp-10a6ee20-9c14-4390-9d0b-bc03e802c4da`) in real-time across all devices.
        </span>
      </div>
    </div>
  );
};
