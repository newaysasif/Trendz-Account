import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Building,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  Calendar,
  Pin,
  PinOff,
} from 'lucide-react';
import { Bank, BankTransaction } from '../types';
import { ReceiptImageUploader } from './ReceiptImageUploader';
import { ReceiptThumbnail } from './ReceiptThumbnail';

interface BankStatementsViewProps {
  banks: Bank[];
  bankTransactions: BankTransaction[];
  onAddTransaction: (tx: Omit<BankTransaction, 'id'>) => void;
  onUpdateTransaction: (id: number, tx: Partial<BankTransaction>) => void;
  onDeleteTransaction: (id: number) => void;
}

export const BankStatementsView: React.FC<BankStatementsViewProps> = ({
  banks,
  bankTransactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<number>(banks[0]?.id || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [freezeColumns, setFreezeColumns] = useState<boolean>(true);

  // Form State for Add
  const [formData, setFormData] = useState({
    trans_date: new Date().toISOString().split('T')[0],
    description: '',
    trans_type: 'debit' as 'debit' | 'credit',
    amount: '',
    receipt_image: undefined as string | undefined,
    receipt_image_name: undefined as string | undefined,
  });

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({
    trans_date: '',
    description: '',
    trans_type: 'debit' as 'debit' | 'credit',
    amount: '',
    bank_id: 1,
    receipt_image: undefined as string | undefined,
    receipt_image_name: undefined as string | undefined,
  });

  const currentBank = banks.find((b) => b.id === selectedBankId) || banks[0];

  // Transactions for selected bank
  const currentTransactions = useMemo(() => {
    return bankTransactions
      .filter((t) => t.bank_id === selectedBankId)
      .filter((t) => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (typeFilter === 'debit') return t.debit > 0;
        if (typeFilter === 'credit') return t.credit > 0;
        return true;
      })
      .sort((a, b) => new Date(b.trans_date).getTime() - new Date(a.trans_date).getTime());
  }, [bankTransactions, selectedBankId, searchTerm, typeFilter]);

  // Chronological running balance for each transaction
  const transactionsWithRunningBalance = useMemo(() => {
    if (!currentBank) return [];
    // Sort all transactions for this bank chronologically (oldest to newest)
    const allBankTxAsc = [...bankTransactions]
      .filter((t) => t.bank_id === selectedBankId)
      .sort((a, b) => {
        const timeA = new Date(a.trans_date).getTime();
        const timeB = new Date(b.trans_date).getTime();
        return timeA !== timeB ? timeA - timeB : a.id - b.id;
      });

    let running = currentBank.opening_balance;
    const balanceMap = new Map<number, number>();
    allBankTxAsc.forEach((tx) => {
      running += tx.debit - tx.credit;
      balanceMap.set(tx.id, running);
    });

    return currentTransactions.map((tx) => ({
      ...tx,
      runningBalance: balanceMap.get(tx.id) ?? 0,
    }));
  }, [currentBank, bankTransactions, selectedBankId, currentTransactions]);

  // Running balance calculation
  const calculatedBalance = useMemo(() => {
    if (!currentBank) return 0;
    const allBankTx = bankTransactions.filter((t) => t.bank_id === selectedBankId);
    let bal = currentBank.opening_balance;
    allBankTx.forEach((t) => {
      bal += t.debit - t.credit;
    });
    return bal;
  }, [currentBank, bankTransactions, selectedBankId]);

  const totalDebit = useMemo(
    () => currentTransactions.reduce((s, t) => s + t.debit, 0),
    [currentTransactions]
  );
  const totalCredit = useMemo(
    () => currentTransactions.reduce((s, t) => s + t.credit, 0),
    [currentTransactions]
  );

  const handleOpenAdd = () => {
    setFormData({
      trans_date: new Date().toISOString().split('T')[0],
      description: '',
      trans_type: 'debit',
      amount: '',
      receipt_image: undefined,
      receipt_image_name: undefined,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tx: BankTransaction) => {
    const isDebit = tx.debit > 0;
    const amt = isDebit ? tx.debit : tx.credit;
    setEditingTransaction(tx);
    setEditFormData({
      trans_date: tx.trans_date,
      description: tx.description,
      trans_type: isDebit ? 'debit' : 'credit',
      amount: amt.toString(),
      bank_id: tx.bank_id,
      receipt_image: tx.receipt_image,
      receipt_image_name: tx.receipt_image_name,
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!formData.description || isNaN(amt) || amt <= 0) {
      alert('Please fill valid transaction details');
      return;
    }

    onAddTransaction({
      bank_id: selectedBankId,
      trans_date: formData.trans_date,
      description: formData.description,
      debit: formData.trans_type === 'debit' ? amt : 0,
      credit: formData.trans_type === 'credit' ? amt : 0,
      receipt_image: formData.receipt_image,
      receipt_image_name: formData.receipt_image_name,
    });

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const amt = parseFloat(editFormData.amount);
    if (!editFormData.description || isNaN(amt) || amt <= 0) {
      alert('Please enter valid details and amount');
      return;
    }

    onUpdateTransaction(editingTransaction.id, {
      bank_id: editFormData.bank_id,
      trans_date: editFormData.trans_date,
      description: editFormData.description,
      debit: editFormData.trans_type === 'debit' ? amt : 0,
      credit: editFormData.trans_type === 'credit' ? amt : 0,
      receipt_image: editFormData.receipt_image,
      receipt_image_name: editFormData.receipt_image_name,
    });

    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              TRENDZ INTERIOR
            </span>
            <span className="text-xs text-slate-400 font-medium">Bank Accounts & Ledgers</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <Landmark className="w-7 h-7 text-blue-600" />
            <span>Bank Statements Ledger</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time reconciliation, deposits (debit), withdrawals (credit), and running ledger balances
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Transaction</span>
          </button>
        </div>
      </div>

      {/* Bank Profile Banner (Sticky at top when scrolling down) */}
      {currentBank && (
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-slate-200 shadow-md sticky top-0 z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Bank:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
                  className="font-bold text-lg text-slate-900 bg-transparent border-b-2 border-dashed border-blue-500 pb-0.5 focus:outline-none cursor-pointer"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong>A/C No:</strong> <span className="font-mono">{currentBank.account_no}</span>
                </span>
                <span>
                  <strong>Branch:</strong> {currentBank.branch}
                </span>
                <span>
                  <strong>Holder:</strong> {currentBank.holder_name}
                </span>
                <span>
                  <strong>Opening:</strong> Rs. {currentBank.opening_balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setFreezeColumns(!freezeColumns)}
              title="Toggle frozen Name and Bank Balance columns when scrolling"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
                freezeColumns
                  ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {freezeColumns ? (
                <>
                  <Pin className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Frozen: Name & Balance (ON)</span>
                </>
              ) : (
                <>
                  <PinOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Freeze: OFF</span>
                </>
              )}
            </button>

            <div className="bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-xl text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Current Available Balance
              </span>
              <div
                className={`text-2xl font-black font-mono leading-tight ${
                  calculatedBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                Rs. {calculatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search bank transactions by description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                typeFilter === 'all' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({bankTransactions.filter((t) => t.bank_id === selectedBankId).length})
            </button>
            <button
              onClick={() => setTypeFilter('debit')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                typeFilter === 'debit' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Deposits (+)
            </button>
            <button
              onClick={() => setTypeFilter('credit')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                typeFilter === 'credit' ? 'bg-white font-bold text-rose-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Withdrawals (-)
            </button>
          </div>
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            {currentTransactions.length} Entries
          </span>
        </div>
      </div>

      {/* Transaction Table with Freeze Panes (Sticky Name & Bank Balance) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto relative">
          <table className="w-full text-left border-collapse text-sm min-w-[900px]">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs shadow-xs border-b border-slate-200">
              <tr className="text-slate-700 text-xs uppercase font-bold">
                <th
                  className={`py-3.5 px-4 w-12 text-center ${
                    freezeColumns ? 'sticky left-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  #
                </th>
                <th
                  className={`py-3.5 px-4 w-28 ${
                    freezeColumns ? 'sticky left-12 z-30 bg-slate-100' : ''
                  }`}
                >
                  Date
                </th>
                <th
                  className={`py-3.5 px-4 min-w-[220px] ${
                    freezeColumns
                      ? 'sticky left-40 z-30 bg-slate-100 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Description / Particulars</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right text-emerald-700 w-44">Deposit / Debit (Rs.)</th>
                <th className="py-3.5 px-4 text-right text-rose-700 w-44">Withdrawal / Credit (Rs.)</th>
                <th
                  className={`py-3.5 px-4 text-right text-blue-900 w-48 font-black ${
                    freezeColumns
                      ? 'sticky right-24 z-30 bg-slate-100 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Bank Balance (Rs.)</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`py-3.5 px-4 text-center w-24 no-print ${
                    freezeColumns ? 'sticky right-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Initial Opening Balance Row */}
              {currentBank && (
                <tr className="bg-blue-50/40 font-semibold text-blue-900">
                  <td
                    className={`py-3 px-4 font-mono text-xs text-center ${
                      freezeColumns ? 'sticky left-0 z-10 bg-blue-50/90' : ''
                    }`}
                  >
                    -
                  </td>
                  <td
                    className={`py-3 px-4 whitespace-nowrap font-mono text-xs ${
                      freezeColumns ? 'sticky left-12 z-10 bg-blue-50/90' : ''
                    }`}
                  >
                    {currentBank.open_date}
                  </td>
                  <td
                    className={`py-3 px-4 flex items-center gap-2 ${
                      freezeColumns
                        ? 'sticky left-40 z-10 bg-blue-50/90 border-r border-blue-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                        : ''
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span>Opening Balance Registered</span>
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-mono font-bold">
                    Rs. {currentBank.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">-</td>
                  <td
                    className={`py-3 px-4 text-right text-blue-900 font-mono font-bold ${
                      freezeColumns
                        ? 'sticky right-24 z-10 bg-blue-50/90 border-l border-blue-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                        : ''
                    }`}
                  >
                    Rs. {currentBank.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-3 px-4 text-center text-xs text-slate-400 no-print font-medium ${
                      freezeColumns ? 'sticky right-0 z-10 bg-blue-50/90' : ''
                    }`}
                  >
                    (Base)
                  </td>
                </tr>
              )}

              {transactionsWithRunningBalance.length > 0 ? (
                transactionsWithRunningBalance.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/90 transition-colors group">
                    <td
                      className={`py-3 px-4 font-mono text-xs text-slate-400 text-center ${
                        freezeColumns ? 'sticky left-0 z-10 bg-white group-hover:bg-slate-50' : ''
                      }`}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className={`py-3 px-4 text-slate-700 font-medium whitespace-nowrap font-mono text-xs ${
                        freezeColumns ? 'sticky left-12 z-10 bg-white group-hover:bg-slate-50' : ''
                      }`}
                    >
                      {tx.trans_date}
                    </td>
                    <td
                      className={`py-3 px-4 font-medium text-slate-900 ${
                        freezeColumns
                          ? 'sticky left-40 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {tx.debit > 0 ? (
                            <span className="p-1 rounded bg-emerald-100 text-emerald-700 shrink-0">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded bg-rose-100 text-rose-700 shrink-0">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-semibold text-slate-900">{tx.description}</span>
                        </div>
                        {tx.receipt_image && (
                          <ReceiptThumbnail
                            image={tx.receipt_image}
                            imageName={tx.receipt_image_name}
                            title={`Slip / Voucher: ${tx.description}`}
                            size="sm"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-emerald-600 whitespace-nowrap">
                      {tx.debit > 0
                        ? `Rs. ${tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-rose-600 whitespace-nowrap">
                      {tx.credit > 0
                        ? `Rs. ${tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold font-mono whitespace-nowrap ${
                        tx.runningBalance >= 0 ? 'text-blue-900' : 'text-rose-600'
                      } ${
                        freezeColumns
                          ? 'sticky right-24 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                          : ''
                      }`}
                    >
                      Rs. {tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3 px-4 text-center no-print ${
                        freezeColumns ? 'sticky right-0 z-10 bg-white group-hover:bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          title="Edit Transaction"
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete bank transaction: "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Delete Transaction"
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No custom transactions found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td
                  colSpan={3}
                  className={`py-3 px-4 text-right ${
                    freezeColumns ? 'sticky left-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Filtered Period Totals:
                </td>
                <td className="py-3 px-4 text-right text-emerald-700 font-mono">
                  Rs. {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right text-rose-700 font-mono">
                  Rs. {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`py-3 px-4 text-right text-blue-900 font-mono font-black ${
                    freezeColumns
                      ? 'sticky right-24 z-30 bg-slate-100 border-l border-slate-200'
                      : ''
                  }`}
                >
                  Rs. {calculatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`no-print ${
                    freezeColumns ? 'sticky right-0 z-30 bg-slate-100' : ''
                  }`}
                ></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>Add Bank Transaction</span>
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Bank Account
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>{currentBank?.bank_name}</span>
                  <span className="text-xs text-slate-500 font-mono">{currentBank?.account_no}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.trans_date}
                    onChange={(e) => setFormData({ ...formData, trans_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={formData.trans_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trans_type: e.target.value as 'debit' | 'credit',
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-bold"
                  >
                    <option value="debit">Deposit / Debit (+)</option>
                    <option value="credit">Withdrawal / Credit (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Particulars *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Payment / Vendor Cheque / Studio Supplies"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono text-slate-900"
                />
              </div>

              {/* Receipt / Voucher Image Attachment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <ReceiptImageUploader
                  idPrefix="bank-tx-add"
                  receiptImage={formData.receipt_image}
                  receiptImageName={formData.receipt_image_name}
                  onChange={(img, name) =>
                    setFormData({ ...formData, receipt_image: img, receipt_image_name: name })
                  }
                  label="Attach Deposit Slip / Cheque Copy / Bank Voucher"
                  helperText="Upload image/photo of deposit slip, counterfoil, or online transfer receipt"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>Edit Bank Ledger Entry</span>
              </h4>
              <button
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bank Account
                </label>
                <select
                  value={editFormData.bank_id}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bank_id: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} ({b.account_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.trans_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, trans_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Type *
                  </label>
                  <select
                    value={editFormData.trans_type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        trans_type: e.target.value as 'debit' | 'credit',
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="debit">Deposit / Debit (+)</option>
                    <option value="credit">Withdrawal / Credit (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Particulars *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editFormData.amount}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono text-slate-900"
                />
              </div>

              {/* Receipt / Voucher Image Attachment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <ReceiptImageUploader
                  idPrefix="bank-tx-edit"
                  receiptImage={editFormData.receipt_image}
                  receiptImageName={editFormData.receipt_image_name}
                  onChange={(img, name) =>
                    setEditFormData({
                      ...editFormData,
                      receipt_image: img,
                      receipt_image_name: name,
                    })
                  }
                  label="Attach Deposit Slip / Cheque Copy / Bank Voucher"
                  helperText="Upload image/photo of deposit slip, counterfoil, or online transfer receipt"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
