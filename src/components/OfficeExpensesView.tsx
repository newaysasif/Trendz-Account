import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  CreditCard,
  Banknote,
  Send,
  Calendar,
  Layers,
  FileSpreadsheet,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { OfficeExpense, Bank } from '../types';

interface OfficeExpensesViewProps {
  expenses: OfficeExpense[];
  banks: Bank[];
  onAddExpense: (expense: Omit<OfficeExpense, 'id'>) => void;
  onUpdateExpense: (id: number, expense: Partial<OfficeExpense>) => void;
  onDeleteExpense: (id: number) => void;
  onOpenWhatsApp: (message: string) => void;
}

const CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries & Wages',
  'Internet & Tech',
  'Office Supplies',
  'Tea & Pantry',
  'Maintenance & Repairs',
  'Printing & Stationery',
  'Miscellaneous',
] as const;

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash / Petty Cash',
  'Cheque',
  'Credit / Debit Card',
  'UPI / Online',
] as const;

export const OfficeExpensesView: React.FC<OfficeExpensesViewProps> = ({
  expenses,
  banks,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OfficeExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<OfficeExpense | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    expense_date: string;
    category: (typeof CATEGORIES)[number];
    description: string;
    paid_to: string;
    payment_method: (typeof PAYMENT_METHODS)[number];
    bank_id: string;
    bill_no: string;
    amount: string;
    notes: string;
  }>({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies',
    description: '',
    paid_to: '',
    payment_method: 'Cash / Petty Cash',
    bank_id: banks[0]?.id.toString() || '',
    bill_no: '',
    amount: '',
    notes: '',
  });

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.paid_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.bill_no && exp.bill_no.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat =
        selectedCategory === 'ALL' || exp.category === selectedCategory;

      const matchPay =
        selectedPaymentMethod === 'ALL' ||
        exp.payment_method === selectedPaymentMethod;

      const matchDate = !dateFilter || exp.expense_date === dateFilter;

      return matchSearch && matchCat && matchPay && matchDate;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, dateFilter]);

  // Statistics
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const thisMonthTotal = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return expenses
      .filter((e) => e.expense_date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const bankPaidTotal = useMemo(
    () =>
      expenses
        .filter(
          (e) =>
            e.payment_method === 'Bank Transfer' ||
            e.payment_method === 'Cheque' ||
            e.payment_method === 'UPI / Online'
        )
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const cashPettyTotal = useMemo(
    () =>
      expenses
        .filter((e) => e.payment_method === 'Cash / Petty Cash')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const highestCategory = categoryStats[0] || ['None', 0];

  const handleOpenAdd = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      category: 'Office Supplies',
      description: '',
      paid_to: '',
      payment_method: 'Cash / Petty Cash',
      bank_id: banks[0]?.id.toString() || '',
      bill_no: '',
      amount: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp: OfficeExpense) => {
    setEditingExpense(exp);
    setFormData({
      expense_date: exp.expense_date,
      category: exp.category,
      description: exp.description,
      paid_to: exp.paid_to,
      payment_method: exp.payment_method,
      bank_id: exp.bank_id?.toString() || (banks[0]?.id.toString() || ''),
      bill_no: exp.bill_no || '',
      amount: exp.amount.toString(),
      notes: exp.notes || '',
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    const payload = {
      expense_date: formData.expense_date,
      category: formData.category,
      description: formData.description,
      paid_to: formData.paid_to,
      payment_method: formData.payment_method,
      bank_id:
        formData.payment_method !== 'Cash / Petty Cash' && formData.bank_id
          ? parseInt(formData.bank_id, 10)
          : undefined,
      bill_no: formData.bill_no.trim() || undefined,
      amount: amountNum,
      notes: formData.notes.trim() || undefined,
    };

    if (editingExpense) {
      onUpdateExpense(editingExpense.id, payload);
      setEditingExpense(null);
    } else {
      onAddExpense(payload);
      setIsAddModalOpen(false);
    }
  };

  const handleSendWhatsAppSummary = () => {
    let msg = `*TRENDZ INTERIOR*\n`;
    msg += `*OFFICE EXPENSES SUMMARY*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall\n`;
    msg += `------------------------------------\n`;
    msg += `Date: ${new Date().toLocaleDateString()}\n`;
    msg += `------------------------------------\n`;
    msg += `*Total Office Expenditures:* Rs. ${totalAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}\n`;
    msg += `*This Month Total:* Rs. ${thisMonthTotal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}\n`;
    msg += `*Paid via Bank / Cheque:* Rs. ${bankPaidTotal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}\n`;
    msg += `*Petty Cash Expenses:* Rs. ${cashPettyTotal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}\n\n`;
    msg += `*Category Breakdown:*\n`;
    categoryStats.forEach(([cat, amt]) => {
      msg += `• ${cat}: Rs. ${amt.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })}\n`;
    });
    msg += `------------------------------------\n`;
    msg += `Recent 5 Office Vouchers:\n`;
    expenses.slice(0, 5).forEach((e, idx) => {
      msg += `${idx + 1}. [${e.expense_date}] ${e.category} - Rs. ${e.amount.toLocaleString()}\n   ${e.description} (${e.paid_to})\n`;
    });
    msg += `\n*TRENDZ INTERIOR*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall | Contact: +92 300 8594210`;

    onOpenWhatsApp(msg);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Rent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Utilities':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Salaries & Wages':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Internet & Tech':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Office Supplies':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Tea & Pantry':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Maintenance & Repairs':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Printing & Stationery':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Building className="w-7 h-7 text-blue-600" />
            <span>Office Expenses Sheet</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage administrative expenditures, recurring overheads, utility bills, and petty cash logs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Office Expense</span>
          </button>
          <button
            onClick={handleSendWhatsAppSummary}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp Summary</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-100">
              Total Office Expense
            </span>
            <DollarSign className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-purple-200 mt-1 font-medium">
            {expenses.length} Total Recorded Vouchers
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              This Month (Jan 2024)
            </span>
            <Calendar className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {thisMonthTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            Current Billing Cycle Total
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-100">
              Paid via Bank / Cheque
            </span>
            <CreditCard className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {bankPaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-200 mt-1 font-medium">
            Bank debits & electronic clearing
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Petty Cash Disbursements
            </span>
            <Banknote className="w-6 h-6 opacity-60 text-amber-900" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            Rs. {cashPettyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-950 mt-1 font-medium">
            Highest: {highestCategory[0]}
          </div>
        </div>
      </div>

      {/* Category Pills Breakdown */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Tag className="w-4 h-4 text-blue-500" />
            <span>Category Spending Breakdown</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {categoryStats.length} Active Categories
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryStats.map(([cat, amt]) => {
            const pct = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(1) : '0';
            return (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    selectedCategory === cat
                      ? 'bg-blue-800 text-blue-100'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Rs. {amt.toLocaleString()} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, payee, bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Categories ({CATEGORIES.length})</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selector */}
          <div>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Payment Methods</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expense Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base m-0">
              Office Expense Ledger
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {filteredExpenses.length} Records
            </span>
          </div>
          <div className="text-sm font-bold text-slate-700">
            Filtered Total: <span className="text-blue-700">Rs. {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">Sr#</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Paid To (Beneficiary)</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Bill / Ref #</th>
                <th className="py-3.5 px-4 text-right">Amount (Rs.)</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                          exp.category
                        )}`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                      <div>{exp.description}</div>
                      {exp.notes && (
                        <div className="text-xs text-slate-500 mt-0.5 italic">
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.paid_to}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        {exp.payment_method === 'Cash / Petty Cash' ? (
                          <Banknote className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {exp.bill_no || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      Rs. {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingExpense(exp)}
                          title="View Details"
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          title="Edit"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete office expense: "${exp.description}"?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          title="Delete"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold">No office expenses found</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Try clearing filters or click "Add Office Expense" to record a new bill.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={7} className="py-3 px-4 text-right">
                    Total Office Expenditure:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 text-base">
                    Rs. {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Office Expense Modal */}
      {(isAddModalOpen || editingExpense) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Building className="w-5 h-5 text-blue-400" />
                <span>{editingExpense ? 'Edit Office Expense' : 'Add New Office Expense'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingExpense(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as (typeof CATEGORIES)[number],
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly High-Speed Fiber Internet Bill"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Paid To / Beneficiary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nayatel Telecom Ltd / Landlord"
                    value={formData.paid_to}
                    onChange={(e) =>
                      setFormData({ ...formData, paid_to: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bill / Voucher #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-99042 / PV-102"
                    value={formData.bill_no}
                    onChange={(e) =>
                      setFormData({ ...formData, bill_no: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value as (typeof PAYMENT_METHODS)[number],
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
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
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {formData.payment_method !== 'Cash / Petty Cash' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Associated Bank Account
                  </label>
                  <select
                    value={formData.bank_id}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} ({b.account_no})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Additional Notes / Verification Info
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes, verification by accounts, approval ID..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-sky-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Eye className="w-5 h-5" />
                <span>Office Expense Voucher #{viewingExpense.id}</span>
              </h4>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-sky-100 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Date</span>
                  <div className="font-bold text-slate-800">{viewingExpense.expense_date}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Category</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryBadgeClass(viewingExpense.category)}`}>
                      {viewingExpense.category}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Description</span>
                <div className="text-base font-semibold text-slate-900 mt-0.5">
                  {viewingExpense.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Paid To (Beneficiary)</span>
                  <div className="font-semibold text-slate-800">{viewingExpense.paid_to}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Bill / Reference #</span>
                  <div className="font-mono text-slate-800">{viewingExpense.bill_no || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Payment Method</span>
                  <div className="font-semibold text-slate-800">{viewingExpense.payment_method}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Amount Paid</span>
                  <div className="text-xl font-bold text-emerald-600">
                    Rs. {viewingExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {viewingExpense.notes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-bold">Audit Notes:</span>
                  <p className="text-xs text-slate-700 mt-1 m-0">{viewingExpense.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  onClick={() => setViewingExpense(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
