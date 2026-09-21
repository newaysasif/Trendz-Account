import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Phone,
  Mail,
  BookOpen,
  Send,
  Printer,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Vendor, VendorTransaction } from '../types';
import { ReceiptImageUploader } from './ReceiptImageUploader';
import { ReceiptThumbnail } from './ReceiptThumbnail';

interface VendorsViewProps {
  vendors: Vendor[];
  vendorTransactions: VendorTransaction[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (id: number, vendor: Partial<Vendor>) => void;
  onDeleteVendor: (id: number) => void;
  onAddVendorTransaction: (tx: Omit<VendorTransaction, 'id'>) => void;
  onUpdateVendorTransaction?: (id: number, tx: Partial<VendorTransaction>) => void;
  onDeleteVendorTransaction?: (id: number) => void;
  onOpenWhatsApp: (message: string) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  vendors,
  vendorTransactions,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddVendorTransaction,
  onUpdateVendorTransaction,
  onDeleteVendorTransaction,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [ledgerVendor, setLedgerVendor] = useState<Vendor | null>(null);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<VendorTransaction | null>(null);

  // Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    name: '',
    company_name: '',
    phone: '',
    address: '',
    email: '',
  });

  // Transaction Form State
  const [txForm, setTxForm] = useState<{
    trans_date: string;
    description: string;
    qty: string;
    rate: string;
    discount: string;
    amount: string;
    trans_type: 'debit' | 'credit';
    receipt_image?: string;
    receipt_image_name?: string;
  }>({
    trans_date: new Date().toISOString().split('T')[0],
    description: '',
    qty: '',
    rate: '',
    discount: '',
    amount: '',
    trans_type: 'debit',
    receipt_image: undefined,
    receipt_image_name: undefined,
  });

  const filteredVendors = vendors.filter(
    (v) =>
      v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Current Vendor Ledger Calculations
  const currentLedgerTxs = useMemo(() => {
    if (!ledgerVendor) return [];
    return vendorTransactions.filter((t) => t.vendor_id === ledgerVendor.id);
  }, [ledgerVendor, vendorTransactions]);

  const totalPurchasesDebit = useMemo(
    () =>
      currentLedgerTxs
        .filter((t) => t.trans_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0),
    [currentLedgerTxs]
  );

  const totalPaidCredit = useMemo(
    () =>
      currentLedgerTxs
        .filter((t) => t.trans_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
    [currentLedgerTxs]
  );

  const balancePayable = totalPurchasesDebit - totalPaidCredit;

  const ledgerTxsWithBalance = useMemo(() => {
    if (!ledgerVendor) return [];
    const sortedAsc = [...currentLedgerTxs].sort((a, b) => {
      const timeA = new Date(a.trans_date).getTime();
      const timeB = new Date(b.trans_date).getTime();
      return timeA !== timeB ? timeA - timeB : a.id - b.id;
    });

    let runningBal = 0;
    const balanceMap = new Map<number, number>();
    sortedAsc.forEach((tx) => {
      if (tx.trans_type === 'debit') {
        runningBal += tx.amount;
      } else {
        runningBal -= tx.amount;
      }
      balanceMap.set(tx.id, runningBal);
    });

    return currentLedgerTxs.map((tx) => ({
      ...tx,
      runningBalance: balanceMap.get(tx.id) ?? 0,
    }));
  }, [ledgerVendor, currentLedgerTxs]);

  const handleOpenAddVendor = () => {
    setVendorForm({
      name: '',
      company_name: '',
      phone: '',
      address: '',
      email: '',
    });
    setIsAddVendorModalOpen(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      company_name: v.company_name,
      phone: v.phone,
      address: v.address,
      email: v.email,
    });
  };

  const handleSubmitVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.company_name.trim() || !vendorForm.name.trim()) {
      alert('Vendor company name and contact person are required');
      return;
    }

    if (editingVendor) {
      onUpdateVendor(editingVendor.id, vendorForm);
      setEditingVendor(null);
    } else {
      onAddVendor(vendorForm);
      setIsAddVendorModalOpen(false);
    }
  };

  const handleAutoCalcAmount = (qtyStr: string, rateStr: string, discStr: string) => {
    const q = parseFloat(qtyStr) || 0;
    const r = parseFloat(rateStr) || 0;
    const d = parseFloat(discStr) || 0;
    if (q > 0 && r > 0) {
      const net = q * r - d;
      setTxForm((prev) => ({ ...prev, amount: net > 0 ? net.toString() : '0' }));
    }
  };

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setTxForm({
      trans_date: new Date().toISOString().split('T')[0],
      description: '',
      qty: '',
      rate: '',
      discount: '',
      amount: '',
      trans_type: 'debit',
      receipt_image: undefined,
      receipt_image_name: undefined,
    });
    setIsAddTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: VendorTransaction) => {
    setEditingTx(tx);
    setTxForm({
      trans_date: tx.trans_date,
      description: tx.description,
      qty: tx.qty > 0 ? tx.qty.toString() : '',
      rate: tx.rate > 0 ? tx.rate.toString() : '',
      discount: tx.discount > 0 ? tx.discount.toString() : '',
      amount: tx.amount.toString(),
      trans_type: tx.trans_type,
      receipt_image: tx.receipt_image,
      receipt_image_name: tx.receipt_image_name,
    });
    setIsAddTxModalOpen(true);
  };

  const handleDeleteTx = (id: number) => {
    if (confirm('Are you sure you want to delete this transaction? This will automatically recalculate the vendor balance.')) {
      if (onDeleteVendorTransaction) {
        onDeleteVendorTransaction(id);
      }
    }
  };

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerVendor) return;
    const amt = parseFloat(txForm.amount);
    if (!txForm.description.trim() || isNaN(amt) || amt <= 0) {
      alert('Please enter valid transaction description and amount');
      return;
    }

    if (editingTx) {
      if (onUpdateVendorTransaction) {
        onUpdateVendorTransaction(editingTx.id, {
          trans_date: txForm.trans_date,
          description: txForm.description.trim(),
          qty: parseFloat(txForm.qty) || 0,
          rate: parseFloat(txForm.rate) || 0,
          discount: parseFloat(txForm.discount) || 0,
          amount: amt,
          trans_type: txForm.trans_type,
          receipt_image: txForm.receipt_image,
          receipt_image_name: txForm.receipt_image_name,
        });
      }
      setEditingTx(null);
    } else {
      onAddVendorTransaction({
        vendor_id: ledgerVendor.id,
        trans_date: txForm.trans_date,
        description: txForm.description.trim(),
        qty: parseFloat(txForm.qty) || 0,
        rate: parseFloat(txForm.rate) || 0,
        discount: parseFloat(txForm.discount) || 0,
        amount: amt,
        trans_type: txForm.trans_type,
        receipt_image: txForm.receipt_image,
        receipt_image_name: txForm.receipt_image_name,
      });
    }

    setIsAddTxModalOpen(false);
    setTxForm({
      trans_date: new Date().toISOString().split('T')[0],
      description: '',
      qty: '',
      rate: '',
      discount: '',
      amount: '',
      trans_type: 'debit',
      receipt_image: undefined,
      receipt_image_name: undefined,
    });
  };

  const handleSendVendorWhatsApp = (vendor: Vendor) => {
    const txs = vendorTransactions.filter((t) => t.vendor_id === vendor.id);
    const deb = txs
      .filter((t) => t.trans_type === 'debit')
      .reduce((s, t) => s + t.amount, 0);
    const cr = txs
      .filter((t) => t.trans_type === 'credit')
      .reduce((s, t) => s + t.amount, 0);
    const bal = deb - cr;

    let msg = `*TRENDZ INTERIOR*\n`;
    msg += `*VENDOR STATEMENT*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall\n`;
    msg += `----------------------------------\n`;
    msg += `*Vendor:* ${vendor.company_name}\n`;
    msg += `*Contact:* ${vendor.name}\n`;
    msg += `*Phone:* ${vendor.phone || 'N/A'}\n`;
    msg += `----------------------------------\n`;
    if (txs.length > 0) {
      msg += `*Transaction History:*\n`;
      txs.forEach((t, idx) => {
        msg += `${idx + 1}. ${t.trans_date} - ${t.description}\n`;
        if (t.qty > 0) {
          msg += `   Qty: ${t.qty} × Rs. ${t.rate.toLocaleString()}\n`;
        }
        msg += `   Amount: Rs. ${t.amount.toLocaleString()} [${t.trans_type.toUpperCase()}]\n\n`;
      });
      msg += `----------------------------------\n`;
      msg += `*Total Purchases (Debit):* Rs. ${deb.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })}\n`;
      msg += `*Total Paid (Credit):* Rs. ${cr.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })}\n`;
      msg += `*Balance Payable:* Rs. ${bal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })}\n`;
    } else {
      msg += `No transactions recorded.\n`;
    }
    msg += `----------------------------------\n`;
    msg += `*TRENDZ INTERIOR*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall | Contact: +92 300 8594210`;

    onOpenWhatsApp(msg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-amber-600" />
            <span>Vendors & Supplier Ledgers</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage material suppliers, sub-contractors, purchase invoices, and payable balances
          </p>
        </div>
        <button
          onClick={handleOpenAddVendor}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search suppliers by company, contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredVendors.length} Registered Vendors
        </span>
      </div>

      {/* Vendor Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.map((vendor) => {
          const txs = vendorTransactions.filter((t) => t.vendor_id === vendor.id);
          const deb = txs
            .filter((t) => t.trans_type === 'debit')
            .reduce((s, t) => s + t.amount, 0);
          const cr = txs
            .filter((t) => t.trans_type === 'credit')
            .reduce((s, t) => s + t.amount, 0);
          const bal = deb - cr;

          return (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendVendorWhatsApp(vendor)}
                      title="Share Statement via WhatsApp"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditVendor(vendor)}
                      title="Edit Vendor"
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete vendor: "${vendor.company_name}"?`)) {
                          onDeleteVendor(vendor.id);
                        }
                      }}
                      title="Delete Vendor"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base text-slate-900 leading-snug">
                    {vendor.company_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contact: <strong>{vendor.name}</strong>
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>{vendor.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    Balance Payable:
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      bal > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    Rs. {bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => setLedgerVendor(vendor)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ledger</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendor Ledger Modal */}
      {ledgerVendor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Vendor Ledger: {ledgerVendor.company_name}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 m-0">
                  Representative: {ledgerVendor.name} | Phone: {ledgerVendor.phone}
                </p>
              </div>
              <button
                onClick={() => setLedgerVendor(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Total Purchases (Debit)
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    Rs. {totalPurchasesDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Total Payments (Credit)
                  </span>
                  <div className="text-lg font-bold text-emerald-600 mt-1">
                    Rs. {totalPaidCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xs font-semibold text-amber-800 uppercase">
                    Balance Outstanding
                  </span>
                  <div className="text-lg font-black text-rose-600 mt-1">
                    Rs. {balancePayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 text-sm m-0">
                  Transaction History ({currentLedgerTxs.length})
                </h5>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddTx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Transaction</span>
                  </button>
                  <button
                    onClick={() => handleSendVendorWhatsApp(ledgerVendor)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Ledger Table with Sticky Header and Running Balance */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto relative">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="sticky top-0 z-20 bg-slate-100 font-bold text-slate-700 uppercase shadow-xs border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-100 w-24">Date</th>
                      <th className="py-2.5 px-3 sticky left-24 z-30 bg-slate-100 min-w-[180px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        Description
                      </th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate (Rs.)</th>
                      <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3 text-right border-l border-slate-200 font-bold text-amber-900 w-32">
                        Balance (Rs.)
                      </th>
                      <th className="py-2.5 px-3 text-center sticky right-0 z-30 bg-slate-100 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ledgerTxsWithBalance.length > 0 ? (
                      ledgerTxsWithBalance.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 group">
                          <td className="py-2.5 px-3 whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50">
                            {t.trans_date}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 sticky left-24 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate">{t.description}</span>
                              {t.receipt_image && (
                                <ReceiptThumbnail
                                  image={t.receipt_image}
                                  imageName={t.receipt_image_name}
                                  title={`Voucher: ${t.description}`}
                                  size="sm"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">{t.qty || '-'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {t.rate > 0 ? t.rate.toLocaleString() : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            Rs. {t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.trans_type === 'debit'
                                   ? 'bg-rose-100 text-rose-800'
                                   : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {t.trans_type.toUpperCase()}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold font-mono whitespace-nowrap border-l border-slate-200 ${
                              t.runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            Rs. {t.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditTx(t)}
                                title="Edit Transaction"
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTx(t.id)}
                                title="Delete Transaction"
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          No transactions found for this vendor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setLedgerVendor(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {isAddTxModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-base flex items-center gap-2 m-0">
                {editingTx ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingTx ? 'Edit Vendor Transaction' : 'Add Vendor Transaction'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddTxModalOpen(false);
                  setEditingTx(null);
                }}
                className="text-white font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitTx} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={txForm.trans_type}
                  onChange={(e) =>
                    setTxForm({ ...txForm, trans_type: e.target.value as 'debit' | 'credit' })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  <option value="debit">Purchase (Debit - Increases Payable)</option>
                  <option value="credit">Payment Made (Credit - Decreases Payable)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={txForm.trans_date}
                  onChange={(e) => setTxForm({ ...txForm, trans_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel rebar supply / Bank Payment Ref #992"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    step="any"
                    value={txForm.qty}
                    onChange={(e) => {
                      setTxForm({ ...txForm, qty: e.target.value });
                      handleAutoCalcAmount(e.target.value, txForm.rate, txForm.discount);
                    }}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate</label>
                  <input
                    type="number"
                    step="any"
                    value={txForm.rate}
                    onChange={(e) => {
                      setTxForm({ ...txForm, rate: e.target.value });
                      handleAutoCalcAmount(txForm.qty, e.target.value, txForm.discount);
                    }}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount</label>
                  <input
                    type="number"
                    step="any"
                    value={txForm.discount}
                    onChange={(e) => {
                      setTxForm({ ...txForm, discount: e.target.value });
                      handleAutoCalcAmount(txForm.qty, txForm.rate, e.target.value);
                    }}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm text-slate-900"
                />
              </div>

              {/* Receipt / Invoice Image Attachment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <ReceiptImageUploader
                  idPrefix="vendor-tx"
                  receiptImage={txForm.receipt_image}
                  receiptImageName={txForm.receipt_image_name}
                  onChange={(img, name) =>
                    setTxForm({ ...txForm, receipt_image: img, receipt_image_name: name })
                  }
                  label="Attach Vendor Invoice / Delivery Receipt / Voucher"
                  helperText="Upload photo of manual vendor invoice, goods received note, or payment slip"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTxModalOpen(false);
                    setEditingTx(null);
                  }}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {editingTx ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      {(isAddVendorModalOpen || editingVendor) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddVendorModalOpen(false);
                  setEditingVendor(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vendor Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prime Steel Mills & Cables"
                  value={vendorForm.company_name}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, company_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+92 301 1234567"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Warehouse / Depot Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Industrial Area, Market, City"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddVendorModalOpen(false);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
