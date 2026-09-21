import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Printer,
  Search,
  Eye,
  Send,
  Calendar,
  DollarSign,
  FileText,
  User,
  PlusCircle,
  Edit,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  ArrowRight,
  Sparkles,
  Pin,
  PinOff,
} from 'lucide-react';
import { Invoice, InvoiceItem, Customer, Product, Bank, PaymentReceipt } from '../types';
import { TrendzLogo, TrendzLogoMark } from './TrendzLogo';

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  banks: Bank[];
  onSaveInvoice: (
    invoice: Omit<Invoice, 'id'>,
    paymentDetails?: {
      receipt_no: string;
      receipt_date: string;
      amount_received: number;
      payment_mode: PaymentReceipt['payment_mode'];
      bank_id?: number;
      transaction_ref?: string;
      received_by?: string;
      notes?: string;
    }
  ) => void;
  onUpdateInvoice: (
    id: number,
    updated: Partial<Invoice>,
    paymentDetails?: {
      receipt_no: string;
      receipt_date: string;
      amount_received: number;
      payment_mode: PaymentReceipt['payment_mode'];
      bank_id?: number;
      transaction_ref?: string;
      received_by?: string;
      notes?: string;
    }
  ) => void;
  onDeleteInvoice: (id: number) => void;
  onReceivePayment: (payment: {
    invoice_id: number;
    receipt_no: string;
    receipt_date: string;
    amount_received: number;
    payment_mode: PaymentReceipt['payment_mode'];
    bank_id?: number;
    transaction_ref?: string;
    received_by?: string;
    notes?: string;
  }) => void;
  onOpenWhatsApp: (message: string) => void;
  onViewReceiptMemo?: (receiptNo: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  customers,
  products,
  banks,
  onSaveInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onReceivePayment,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [freezeColumns, setFreezeColumns] = useState(true);

  // Form State for Create/Edit Invoice
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [taxDeduction, setTaxDeduction] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', qty: 1, rate: 0, discount: 0, tax: 0 },
  ]);

  // Payment Received at Time of Invoicing State
  const [receivePaymentNow, setReceivePaymentNow] = useState(false);
  const [immediatePaidAmount, setImmediatePaidAmount] = useState('');
  const [immediatePaymentMode, setImmediatePaymentMode] = useState<PaymentReceipt['payment_mode']>('Cash');
  const [immediateBankId, setImmediateBankId] = useState<number>(banks[0]?.id || 1);
  const [immediateReceiptNo, setImmediateReceiptNo] = useState('');
  const [immediateReceiptDate, setImmediateReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [immediateTransactionRef, setImmediateTransactionRef] = useState('');
  const [immediateReceivedBy, setImmediateReceivedBy] = useState('Accounts Dept / Trendz Interior');
  const [immediatePaymentNotes, setImmediatePaymentNotes] = useState('');

  // Payment Receive Modal State (for existing unpaid invoices)
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentReceipt['payment_mode']>('Cash');
  const [selectedBankId, setSelectedBankId] = useState<number>(banks[0]?.id || 1);
  const [transactionRef, setTransactionRef] = useState('');
  const [receivedBy, setReceivedBy] = useState('Accounts Dept / Trendz Interior');
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((i) => {
        const matchesSearch =
          i.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;

        const due = i.due_amount ?? (i.grand_total - (i.paid_amount || 0));
        const paid = i.paid_amount || 0;
        const status = i.status || (due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid');

        if (statusFilter === 'all') return true;
        return status === statusFilter;
      })
      .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [invoices, searchTerm, statusFilter]);

  const totalInvoiced = useMemo(
    () => invoices.reduce((s, i) => s + i.grand_total, 0),
    [invoices]
  );

  const totalPaid = useMemo(
    () => invoices.reduce((s, i) => s + (i.paid_amount || 0), 0),
    [invoices]
  );

  const totalOutstanding = useMemo(
    () => invoices.reduce((s, i) => s + (i.due_amount ?? (i.grand_total - (i.paid_amount || 0))), 0),
    [invoices]
  );

  // Auto Calculations for Create/Edit Modal
  const calculatedTotals = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    items.forEach((item) => {
      const lineBase = item.qty * item.rate;
      sub += lineBase;
      disc += item.discount;
      tax += item.tax;
    });

    const adv = parseFloat(advanceAmount) || 0;
    const taxDed = parseFloat(taxDeduction) || 0;
    const grand = Math.max(0, sub - disc + tax - adv - taxDed);
    const paymentNow = receivePaymentNow ? parseFloat(immediatePaidAmount) || 0 : 0;
    const balance = Math.max(0, grand - paymentNow);

    return { sub, disc, tax, adv, taxDed, grand, paymentNow, balance };
  }, [items, advanceAmount, taxDeduction, receivePaymentNow, immediatePaidAmount]);

  const handleOpenCreate = () => {
    setEditingInvoice(null);
    const nextNo = `INV-2024-${(invoices.length + 1).toString().padStart(3, '0')}`;
    const nextRecNo = `REC-2024-${(invoices.length + 101).toString().padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    setInvoiceNo(nextNo);
    setInvoiceDate(today);
    const firstCust = customers[0];
    setCustomerName(firstCust?.name || '');
    setCustomerPhone(firstCust?.phone || '');
    setCustomerAddress(firstCust?.address || '');
    setInvoiceNotes('Interior design and bespoke architectural fitouts');
    setAdvanceAmount('');
    setTaxDeduction('');
    setItems([{ description: '', qty: 1, rate: 0, discount: 0, tax: 0 }]);

    // Reset immediate payment states
    setReceivePaymentNow(false);
    setImmediatePaidAmount('');
    setImmediatePaymentMode('Cash');
    setImmediateBankId(banks[0]?.id || 1);
    setImmediateReceiptNo(nextRecNo);
    setImmediateReceiptDate(today);
    setImmediateTransactionRef('');
    setImmediateReceivedBy('Accounts Dept / Trendz Interior');
    setImmediatePaymentNotes('');

    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceNo(inv.invoice_no);
    setInvoiceDate(inv.invoice_date);
    setCustomerName(inv.customer_name);
    setCustomerPhone(inv.customer_phone || '');
    setCustomerAddress(inv.customer_address || '');
    setInvoiceNotes(inv.notes || '');
    setAdvanceAmount(inv.advance_amount ? inv.advance_amount.toString() : '');
    setTaxDeduction(inv.tax_deduction ? inv.tax_deduction.toString() : '');
    setItems(
      inv.items && inv.items.length > 0
        ? JSON.parse(JSON.stringify(inv.items))
        : [{ description: '', qty: 1, rate: 0, discount: 0, tax: 0 }]
    );

    const paid = inv.paid_amount || 0;
    setReceivePaymentNow(paid > 0);
    setImmediatePaidAmount(paid > 0 ? paid.toString() : '');
    setImmediatePaymentMode('Cash');
    setImmediateBankId(banks[0]?.id || 1);
    setImmediateReceiptNo(`REC-2024-${Math.floor(100 + Math.random() * 900)}`);
    setImmediateReceiptDate(inv.invoice_date);
    setImmediateTransactionRef('');
    setImmediateReceivedBy('Accounts Dept / Trendz Interior');
    setImmediatePaymentNotes(`Payment for invoice #${inv.invoice_no}`);

    setIsAddModalOpen(true);
  };

  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    const matched = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (matched) {
      if (matched.phone && matched.phone !== 'N/A') setCustomerPhone(matched.phone);
      if (matched.address && matched.address !== 'N/A') setCustomerAddress(matched.address);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    if (field === 'description') {
      newItems[index].description = value as string;
      const matched = products.find(
        (p) => p.name.toLowerCase() === (value as string).toLowerCase()
      );
      if (matched) {
        newItems[index].rate = matched.sale_price;
      }
    } else {
      newItems[index][field] = parseFloat(value as string) || 0;
    }
    setItems(newItems);
  };

  const handleAddItemRow = () => {
    setItems([...items, { description: '', qty: 1, rate: 0, discount: 0, tax: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo || !customerName) {
      alert('Please fill invoice number and customer name');
      return;
    }

    const validItems = items.filter((i) => i.description.trim() && i.qty > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid line item');
      return;
    }

    const grand = calculatedTotals.grand;
    const paidAmt = receivePaymentNow ? parseFloat(immediatePaidAmount) || 0 : 0;
    const advAmt = parseFloat(advanceAmount) || 0;
    const taxDedAmt = parseFloat(taxDeduction) || 0;
    const newDue = Math.max(0, grand - paidAmt);
    const newStatus: Invoice['status'] = newDue <= 0 ? 'paid' : paidAmt > 0 ? 'partial' : 'unpaid';

    if (editingInvoice) {
      const prevPaid = editingInvoice.paid_amount || 0;
      const additionalReceived = Math.max(0, paidAmt - prevPaid);

      onUpdateInvoice(
        editingInvoice.id,
        {
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes: invoiceNotes,
          subtotal: calculatedTotals.sub,
          advance_amount: advAmt,
          tax_deduction: taxDedAmt,
          total_discount: calculatedTotals.disc,
          total_tax: calculatedTotals.tax,
          grand_total: grand,
          paid_amount: paidAmt,
          due_amount: newDue,
          status: newStatus,
          items: validItems,
        },
        additionalReceived > 0
          ? {
              receipt_no: immediateReceiptNo || `REC-${Date.now().toString().slice(-4)}`,
              receipt_date: immediateReceiptDate || invoiceDate,
              amount_received: additionalReceived,
              payment_mode: immediatePaymentMode,
              bank_id: immediatePaymentMode !== 'Cash' ? immediateBankId : undefined,
              transaction_ref: immediateTransactionRef,
              received_by: immediateReceivedBy,
              notes: immediatePaymentNotes || `Payment recorded during invoice update #${invoiceNo}`,
            }
          : undefined
      );
    } else {
      onSaveInvoice(
        {
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes: invoiceNotes,
          subtotal: calculatedTotals.sub,
          advance_amount: advAmt,
          tax_deduction: taxDedAmt,
          total_discount: calculatedTotals.disc,
          total_tax: calculatedTotals.tax,
          grand_total: grand,
          paid_amount: paidAmt,
          due_amount: newDue,
          status: newStatus,
          items: validItems,
        },
        paidAmt > 0
          ? {
              receipt_no: immediateReceiptNo || `REC-${Date.now().toString().slice(-4)}`,
              receipt_date: immediateReceiptDate || invoiceDate,
              amount_received: paidAmt,
              payment_mode: immediatePaymentMode,
              bank_id: immediatePaymentMode !== 'Cash' ? immediateBankId : undefined,
              transaction_ref: immediateTransactionRef,
              received_by: immediateReceivedBy,
              notes: immediatePaymentNotes || `Immediate payment received on Invoice #${invoiceNo}`,
            }
          : undefined
      );
    }

    setIsAddModalOpen(false);
    setEditingInvoice(null);
  };

  // Open Payment Receive Modal
  const handleOpenReceivePayment = (inv: Invoice) => {
    const due = inv.due_amount ?? (inv.grand_total - (inv.paid_amount || 0));
    setPaymentModalInvoice(inv);
    setReceiptNo(`REC-2024-${Math.floor(100 + Math.random() * 900)}`);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setPaymentAmount(due > 0 ? due.toString() : inv.grand_total.toString());
    setPaymentMode('Cash');
    setSelectedBankId(banks[0]?.id || 1);
    setTransactionRef('');
    setReceivedBy('Accounts Dept / Trendz Interior');
    setPaymentNotes(`Payment received for invoice #${inv.invoice_no}`);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid received amount');
      return;
    }

    onReceivePayment({
      invoice_id: paymentModalInvoice.id,
      receipt_no: receiptNo,
      receipt_date: receiptDate,
      amount_received: amt,
      payment_mode: paymentMode,
      bank_id: paymentMode !== 'Cash' ? selectedBankId : undefined,
      transaction_ref: transactionRef,
      received_by: receivedBy,
      notes: paymentNotes,
    });

    setPaymentModalInvoice(null);
  };

  const handleSendInvoiceWhatsApp = (inv: Invoice) => {
    const due = inv.due_amount ?? (inv.grand_total - (inv.paid_amount || 0));
    const paid = inv.paid_amount || 0;
    const adv = inv.advance_amount || 0;
    const taxDed = inv.tax_deduction || 0;

    let msg = `*TRENDZ INTERIOR*\n`;
    msg += `*INVOICE*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall\n`;
    msg += `----------------------------------\n`;
    msg += `*Invoice No:* ${inv.invoice_no}\n`;
    msg += `*Date:* ${inv.invoice_date}\n`;
    msg += `*Client Name:* ${inv.customer_name}\n`;
    if (inv.customer_phone) msg += `*Contact:* ${inv.customer_phone}\n`;
    if (inv.customer_address) msg += `*Site/Address:* ${inv.customer_address}\n`;
    msg += `----------------------------------\n`;
    msg += `*Itemized Description:*\n`;
    inv.items.forEach((item, idx) => {
      const lineTotal = item.qty * item.rate - item.discount + item.tax;
      msg += `${idx + 1}. *${item.description}*\n`;
      msg += `   Qty: ${item.qty} × Rs. ${item.rate.toLocaleString()}\n`;
      if (item.discount > 0) msg += `   Discount: -Rs. ${item.discount.toLocaleString()}\n`;
      if (item.tax > 0) msg += `   Tax: +Rs. ${item.tax.toLocaleString()}\n`;
      msg += `   Line Amount: Rs. ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*Sub Total:* Rs. ${inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (adv > 0) {
      msg += `*Advance:* -Rs. ${adv.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    if (taxDed > 0) {
      msg += `*Tax deduction:* -Rs. ${taxDed.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    if (inv.total_discount > 0) {
      msg += `*Discount:* -Rs. ${inv.total_discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    if (inv.total_tax > 0) {
      msg += `*Tax Added:* +Rs. ${inv.total_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    msg += `*Total Payable:* Rs. ${inv.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `*Payment recieve:* Rs. ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `*Balance:* Rs. ${due.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `*Status:* ${(inv.status || (due <= 0 ? 'PAID' : 'PENDING')).toUpperCase()}\n`;
    msg += `----------------------------------\n`;
    msg += `Thank you for choosing *TRENDZ INTERIOR* for your architectural fitouts & interior styling! ✨\n`;
    msg += `*Address:* Suite # LG - 11 Continental Shopping Mall | *Phone:* +92 300 8594210\n`;
    msg += `_Trendz Interior - Architecture & Turnkey Projects_`;

    onOpenWhatsApp(msg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              TRENDZ INTERIOR
            </span>
            <span className="text-xs text-slate-400 font-medium">Billing & Revenue Ledger</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            <span>Customer Billing & Invoices</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and edit commercial invoices, receive partial/full payments, auto bank reconciliation & print PDF
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Total Invoiced Billing
            </span>
            <DollarSign className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2">
            Rs. {totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            {invoices.length} Total Registered Invoices
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Total Payments Received
            </span>
            <CheckCircle2 className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2">
            Rs. {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-blue-100 mt-1 font-medium">
            Collected into Cash & Bank Ledgers
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-950">
              Outstanding Balance Due
            </span>
            <Clock className="w-6 h-6 opacity-60 text-amber-950" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 text-slate-900">
            Rs. {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-950 mt-1 font-medium">
            Pending client invoice receivables
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice #, customer or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <button
            onClick={() => setFreezeColumns(!freezeColumns)}
            title="Toggle frozen Customer Name and Balance Due columns when scrolling"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
              freezeColumns
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {freezeColumns ? (
              <>
                <Pin className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>Frozen: Name & Balance (ON)</span>
              </>
            ) : (
              <>
                <PinOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Freeze: OFF</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                statusFilter === 'all' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                statusFilter === 'paid' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                statusFilter === 'partial' ? 'bg-white font-bold text-amber-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                statusFilter === 'unpaid' ? 'bg-white font-bold text-rose-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Unpaid
            </button>
          </div>
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            {filteredInvoices.length} Invoices
          </span>
        </div>
      </div>

      {/* Invoice List Table with Freeze Panes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto relative">
          <table className="w-full text-left border-collapse text-sm min-w-[1050px]">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs shadow-xs border-b border-slate-200">
              <tr className="text-slate-700 text-xs uppercase font-bold">
                <th
                  className={`py-3.5 px-4 w-28 ${
                    freezeColumns ? 'sticky left-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Invoice #
                </th>
                <th
                  className={`py-3.5 px-4 min-w-[220px] ${
                    freezeColumns
                      ? 'sticky left-28 z-30 bg-slate-100 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Name</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 w-28 whitespace-nowrap">Date</th>
                <th className="py-3.5 px-4 text-center w-28">Status</th>
                <th className="py-3.5 px-4 text-right w-36">Grand Total</th>
                <th className="py-3.5 px-4 text-right text-emerald-700 w-36">Paid Amount</th>
                <th
                  className={`py-3.5 px-4 text-right text-rose-700 font-black w-44 ${
                    freezeColumns
                      ? 'sticky right-44 z-30 bg-slate-100 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Balance Due</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`py-3.5 px-4 text-center no-print w-44 ${
                    freezeColumns ? 'sticky right-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const paid = inv.paid_amount || 0;
                  const due = inv.due_amount ?? Math.max(0, inv.grand_total - paid);
                  const isPaid = due <= 0;
                  const isPartial = paid > 0 && due > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/90 transition-colors group">
                      <td
                        className={`py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap ${
                          freezeColumns ? 'sticky left-0 z-10 bg-white group-hover:bg-slate-50' : ''
                        }`}
                      >
                        {inv.invoice_no}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          freezeColumns
                            ? 'sticky left-28 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                            : ''
                        }`}
                      >
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        {inv.notes && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{inv.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono text-xs">
                        {inv.invoice_date}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Partial</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 font-bold whitespace-nowrap">
                        Rs. {inv.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {paid > 0
                          ? `Rs. ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-black whitespace-nowrap ${
                          due > 0 ? 'text-rose-600' : 'text-slate-400'
                        } ${
                          freezeColumns
                            ? 'sticky right-44 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                            : ''
                        }`}
                      >
                        {due > 0
                          ? `Rs. ${due.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : 'Rs. 0.00'}
                      </td>
                      <td
                        className={`py-3 px-4 text-center no-print ${
                          freezeColumns ? 'sticky right-0 z-10 bg-white group-hover:bg-slate-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* Payment Receive Option */}
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenReceivePayment(inv)}
                              title="Receive Payment / Issue Receipt Memo"
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Receive</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            title="Edit Invoice"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            title="View / Print Invoice PDF"
                            className="p-1.5 text-sky-600 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendInvoiceWhatsApp(inv)}
                            title="Send via WhatsApp"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice: "${inv.invoice_no}"?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            title="Delete Invoice"
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices matching the search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td
                  colSpan={2}
                  className={`py-3 px-4 text-right ${
                    freezeColumns ? 'sticky left-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Filtered Totals ({filteredInvoices.length}):
                </td>
                <td></td>
                <td></td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                  Rs.{' '}
                  {filteredInvoices
                    .reduce((s, inv) => s + inv.grand_total, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                  Rs.{' '}
                  {filteredInvoices
                    .reduce((s, inv) => s + (inv.paid_amount || 0), 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono text-rose-700 font-black ${
                    freezeColumns
                      ? 'sticky right-44 z-30 bg-slate-100 border-l border-slate-200'
                      : ''
                  }`}
                >
                  Rs.{' '}
                  {filteredInvoices
                    .reduce((s, inv) => {
                      const due = inv.due_amount ?? Math.max(0, inv.grand_total - (inv.paid_amount || 0));
                      return s + due;
                    }, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

      {/* Create / Edit Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in my-8">
            <div className="bg-[#0e1319] border-b border-amber-900/30 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-black border border-amber-500/30 shrink-0">
                  <TrendzLogoMark size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black tracking-[0.2em] font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B]">
                      TRENDZ INTERIOR
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-widest border border-amber-500/30">
                      INVOICE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 m-0">
                    {editingInvoice ? `Editing Commercial Invoice: ${editingInvoice.invoice_no}` : 'Commercial Invoicing & Payment Billing'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Invoice # *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Customer / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="customerList"
                    placeholder="Enter or select customer"
                    value={customerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold bg-white"
                  />
                  <datalist id="customerList">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Customer Address / Site
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector F-7 Commercial Plaza"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Project Reference / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Living Room False Ceiling Fitout"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Invoice Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">Line Items & Services</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Description / Product Catalog</th>
                        <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                        <th className="py-2.5 px-2 w-28 text-right">Rate (Rs.)</th>
                        <th className="py-2.5 px-2 w-24 text-right">Discount</th>
                        <th className="py-2.5 px-2 w-24 text-right">Tax</th>
                        <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => {
                        const lineTotal = item.qty * item.rate - item.discount + item.tax;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                list="productList"
                                placeholder="Item description or select product"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(idx, 'description', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                value={item.qty}
                                onChange={(e) =>
                                  handleItemChange(idx, 'qty', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(idx, 'rate', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.discount}
                                onChange={(e) =>
                                  handleItemChange(idx, 'discount', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.tax}
                                onChange={(e) =>
                                  handleItemChange(idx, 'tax', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 text-right font-mono"
                              />
                            </td>
                            <td className="p-2 text-right font-bold font-mono text-slate-800">
                              Rs. {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="text-rose-500 hover:text-rose-700 font-bold text-base cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <datalist id="productList">
                    {products.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Advance & Tax Deduction Adjustments Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm">
                    Advance & Tax Deductions
                  </span>
                  <span className="text-slate-500 text-xs">
                    (Deducted directly from invoice gross subtotal)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase text-xs">
                      Advance (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-400 text-2xs mt-1 block">
                      Prior token or project advance amount
                    </span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase text-xs">
                      Tax Deduction (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={taxDeduction}
                      onChange={(e) => setTaxDeduction(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold text-purple-700 bg-white focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-slate-400 text-2xs mt-1 block">
                      Withholding / PRA / FBR tax deducted by client
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Received At Time of Invoicing Section */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">
                        Payment Received at Time of Invoicing
                      </span>
                      <span className="text-slate-500 text-xs">
                        If client gives payment right now, record it immediately
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={receivePaymentNow}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setReceivePaymentNow(checked);
                        if (checked && !immediatePaidAmount) {
                          setImmediatePaidAmount(calculatedTotals.grand.toString());
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-emerald-900 text-xs">
                      Client gave payment at this time
                    </span>
                  </label>
                </div>

                {receivePaymentNow && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    {/* Quick Payment Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 font-semibold text-xs">Quick Fill:</span>
                      <button
                        type="button"
                        onClick={() => setImmediatePaidAmount(calculatedTotals.grand.toString())}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Paid in Full (100%) - Rs. {calculatedTotals.grand.toLocaleString()}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImmediatePaidAmount((calculatedTotals.grand * 0.5).toFixed(2))
                        }
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        50% Payment - Rs. {(calculatedTotals.grand * 0.5).toLocaleString()}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImmediatePaidAmount((calculatedTotals.grand * 0.25).toFixed(2))
                        }
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        25% Payment - Rs. {(calculatedTotals.grand * 0.25).toLocaleString()}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImmediatePaidAmount('0');
                          setReceivePaymentNow(false);
                        }}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Clear / Unpaid
                      </button>
                    </div>

                    {/* Payment Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-emerald-200">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Amount Received (Rs.) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required={receivePaymentNow}
                          placeholder="e.g. 50000"
                          value={immediatePaidAmount}
                          onChange={(e) => setImmediatePaidAmount(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-400 font-black font-mono text-emerald-700 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Mode of Payment *
                        </label>
                        <select
                          value={immediatePaymentMode}
                          onChange={(e) =>
                            setImmediatePaymentMode(
                              e.target.value as PaymentReceipt['payment_mode']
                            )
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Easypaisa / Jazz Cash">Easypaisa / Jazz Cash</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {immediatePaymentMode !== 'Cash' ? (
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 uppercase">
                            Deposit Account *
                          </label>
                          <select
                            value={immediateBankId}
                            onChange={(e) => setImmediateBankId(parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                          >
                            {banks.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.bank_name} ({b.account_no.slice(-4)})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 uppercase">
                            Receiving Vault
                          </label>
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs truncate">
                            Cash Drawer / Office Vault
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Receipt Memo #
                        </label>
                        <input
                          type="text"
                          value={immediateReceiptNo}
                          onChange={(e) => setImmediateReceiptNo(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Payment / Deposit Date
                        </label>
                        <input
                          type="date"
                          value={immediateReceiptDate}
                          onChange={(e) => setImmediateReceiptDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Cheque # / Txn / Ref No
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CHQ-9912 or Ref #"
                          value={immediateTransactionRef}
                          onChange={(e) => setImmediateTransactionRef(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Received By Officer
                        </label>
                        <input
                          type="text"
                          value={immediateReceivedBy}
                          onChange={(e) => setImmediateReceivedBy(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase">
                          Payment Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Received at time of invoicing"
                          value={immediatePaymentNotes}
                          onChange={(e) => setImmediatePaymentNotes(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Real-time Payment & Balance Feedback */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-between">
                        <span className="font-semibold text-emerald-900 text-xs">Payment Received:</span>
                        <span className="font-bold font-mono text-emerald-800 text-sm">
                          Rs. {(parseFloat(immediatePaidAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-200 flex items-center justify-between">
                        <span className="font-semibold text-amber-900 text-xs">Balance:</span>
                        <span className="font-bold font-mono text-amber-900 text-sm">
                          Rs. {Math.max(0, calculatedTotals.grand - (parseFloat(immediatePaidAmount) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center justify-between">
                        <span className="font-semibold text-blue-900 text-xs">Status:</span>
                        <span className="font-bold uppercase text-xs px-2 py-0.5 rounded bg-white text-blue-800 shadow-2xs">
                          {Math.max(0, calculatedTotals.grand - (parseFloat(immediatePaidAmount) || 0)) <= 0
                            ? 'PAID IN FULL'
                            : (parseFloat(immediatePaidAmount) || 0) > 0
                            ? 'PARTIALLY PAID'
                            : 'UNPAID / ON CREDIT'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-end space-y-1.5 text-xs">
                <div className="w-80 flex justify-between">
                  <span className="text-slate-600 font-bold">Sub Total:</span>
                  <span className="font-bold font-mono text-slate-800">
                    Rs. {calculatedTotals.sub.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {calculatedTotals.adv > 0 && (
                  <div className="w-80 flex justify-between text-blue-700">
                    <span className="font-bold">Advance:</span>
                    <span className="font-bold font-mono">
                      - Rs. {calculatedTotals.adv.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculatedTotals.taxDed > 0 && (
                  <div className="w-80 flex justify-between text-purple-700">
                    <span className="font-bold">Tax deduction:</span>
                    <span className="font-bold font-mono">
                      - Rs. {calculatedTotals.taxDed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculatedTotals.disc > 0 && (
                  <div className="w-80 flex justify-between">
                    <span className="text-slate-500 font-medium">Discount:</span>
                    <span className="font-bold font-mono text-amber-600">
                      - Rs. {calculatedTotals.disc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {calculatedTotals.tax > 0 && (
                  <div className="w-80 flex justify-between">
                    <span className="text-slate-500 font-medium">Tax:</span>
                    <span className="font-bold font-mono text-indigo-600">
                      + Rs. {calculatedTotals.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="w-80 flex justify-between pt-2 border-t border-slate-300 text-sm font-black text-slate-900">
                  <span>Net Invoice Total:</span>
                  <span className="font-mono">
                    Rs. {calculatedTotals.grand.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-80 flex justify-between text-emerald-700 font-bold">
                  <span>Payment recieve:</span>
                  <span className="font-mono">
                    Rs. {(receivePaymentNow ? parseFloat(immediatePaidAmount) || 0 : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-80 flex justify-between text-rose-700 font-black text-sm border-t border-dashed pt-1.5">
                  <span>Balance:</span>
                  <span className="font-mono">
                    Rs. {Math.max(0, calculatedTotals.grand - (receivePaymentNow ? parseFloat(immediatePaidAmount) || 0 : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingInvoice
                      ? 'Update Invoice'
                      : receivePaymentNow && (parseFloat(immediatePaidAmount) || 0) > 0
                      ? 'Save Invoice & Issue Payment Receipt'
                      : 'Save & Issue Invoice'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-lg m-0">Receive Payment & Issue Receipt Memo</h4>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
              {/* Invoice Context Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-emerald-900 font-mono">
                    {paymentModalInvoice.invoice_no}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {paymentModalInvoice.invoice_date}
                  </span>
                </div>
                <div className="font-bold text-slate-900 mt-1">{paymentModalInvoice.customer_name}</div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total:</span>
                    <span className="font-mono font-bold">
                      Rs. {paymentModalInvoice.grand_total.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Already Paid:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      Rs. {(paymentModalInvoice.paid_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Balance Due:</span>
                    <span className="font-mono font-black text-rose-600">
                      Rs. {(paymentModalInvoice.due_amount ?? (paymentModalInvoice.grand_total - (paymentModalInvoice.paid_amount || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Receipt Memo # *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Amount Received (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-lg border border-emerald-400 focus:ring-2 focus:ring-emerald-500 font-black font-mono text-emerald-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(e.target.value as PaymentReceipt['payment_mode'])
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Easypaisa / Jazz Cash">Easypaisa / Jazz Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {paymentMode !== 'Cash' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase">
                      Deposit Into Bank / Account *
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bank_name} ({b.account_no.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase">
                      Receiving Counter
                    </label>
                    <div className="p-2 bg-slate-100 rounded text-slate-700 font-semibold text-xs">
                      Cash Vault / Trendz Office Desk
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Cheque / Transaction Ref / UTR No
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #490192 or Ref #TX-8820"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Received By / Officer
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Receipt Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Receipt & Update Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Print Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden p-8 space-y-6 my-8 border border-slate-200 print-page">
            {/* Branded Official Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-xl bg-black border border-amber-500/40 shadow-sm shrink-0">
                  <TrendzLogoMark size={58} variant="gold" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-[0.18em] font-serif text-slate-950 uppercase m-0">
                      TRENDZ
                    </h3>
                    <span className="text-xl sm:text-2xl font-light tracking-[0.25em] font-serif text-amber-700 uppercase">
                      INTERIOR
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-bold tracking-wide mt-0.5">
                    Suite # LG - 11 Continental Shopping Mall
                  </p>
                  <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
                    Architecture • Turnkey Interior Fitouts • Bespoke Furniture
                  </p>
                  <p className="text-2xs text-slate-500 font-mono mt-0.5">
                    Contact: +92 300 8594210 | Email: trendzinterior@gmail.com
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-4 py-1.5 bg-slate-950 text-amber-400 font-serif font-black tracking-[0.25em] text-sm rounded-md shadow-xs uppercase border border-amber-500/40">
                  INVOICE
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-2">
                  {viewingInvoice.invoice_no}
                </div>
                <div className="text-xs text-slate-500 font-mono">Date: {viewingInvoice.invoice_date}</div>
                <div className="mt-1">
                  {(viewingInvoice.due_amount ?? (viewingInvoice.grand_total - (viewingInvoice.paid_amount || 0))) <= 0 ? (
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      PAID IN FULL
                    </span>
                  ) : (viewingInvoice.paid_amount || 0) > 0 ? (
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      PARTIALLY PAID
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      PAYMENT PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">Billed To (Client):</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {viewingInvoice.customer_name}
                </div>
                {viewingInvoice.customer_phone && (
                  <div className="text-slate-600">Phone: {viewingInvoice.customer_phone}</div>
                )}
                {viewingInvoice.customer_address && (
                  <div className="text-slate-600">Site/Address: {viewingInvoice.customer_address}</div>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">Project / Scope:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {viewingInvoice.notes || 'Interior Fitout & Architectural Specifications'}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="p-2.5 w-8">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center w-16">Qty</th>
                    <th className="p-2.5 text-right w-24">Rate (Rs.)</th>
                    <th className="p-2.5 text-right w-20">Discount</th>
                    <th className="p-2.5 text-right w-20">Tax</th>
                    <th className="p-2.5 text-right w-28 font-bold">Line Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingInvoice.items.map((it, idx) => {
                    const amt = it.qty * it.rate - it.discount + it.tax;
                    return (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">
                          {it.description}
                        </td>
                        <td className="p-2.5 text-center font-mono">{it.qty}</td>
                        <td className="p-2.5 text-right font-mono">Rs. {it.rate.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono text-amber-600">
                          {it.discount > 0 ? `- Rs. ${it.discount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-purple-600">
                          {it.tax > 0 ? `+ Rs. ${it.tax.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          Rs. {amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-start text-xs pt-2">
              <div className="text-slate-500 max-w-sm">
                <span className="font-bold text-slate-700 block mb-1">Payment Instructions:</span>
                <p>Please make cheques payable to <strong>TRENDZ INTERIOR</strong> or transfer directly via Cash, Cheque, or Easypaisa / Jazz Cash.</p>
              </div>

              <div className="w-72 space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Sub Total:</span>
                  <span className="font-mono font-bold">
                    Rs. {viewingInvoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(viewingInvoice.advance_amount || 0) > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Advance:</span>
                    <span className="font-mono">
                      - Rs. {(viewingInvoice.advance_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(viewingInvoice.tax_deduction || 0) > 0 && (
                  <div className="flex justify-between text-purple-700 font-semibold">
                    <span>Tax deduction:</span>
                    <span className="font-mono">
                      - Rs. {(viewingInvoice.tax_deduction || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {viewingInvoice.total_discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Discount:</span>
                    <span className="font-mono font-bold text-amber-600">
                      - Rs. {viewingInvoice.total_discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {viewingInvoice.total_tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Tax:</span>
                    <span className="font-mono font-bold text-purple-600">
                      + Rs. {viewingInvoice.total_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">
                    Rs. {viewingInvoice.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Payment recieve:</span>
                  <span className="font-mono">
                    Rs. {(viewingInvoice.paid_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700 font-black text-sm border-t border-dashed pt-1">
                  <span>Balance:</span>
                  <span className="font-mono">
                    Rs. {(viewingInvoice.due_amount ?? (viewingInvoice.grand_total - (viewingInvoice.paid_amount || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-end border-t text-xs">
              <div className="text-center">
                <div className="w-48 border-b border-slate-400 pb-1 mb-1"></div>
                <span className="text-slate-500 font-medium">Client Signature & Acceptance</span>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900 font-serif">
                  TRENDZ INTERIOR
                </div>
                <span className="text-slate-500 font-medium">Authorized Signature & Stamp</span>
              </div>
            </div>

            {/* Official Document Footer with Address */}
            <div className="border-t border-slate-200 pt-3 text-center text-2xs text-slate-500 space-y-0.5">
              <div className="font-bold tracking-wider text-slate-700 font-serif uppercase">
                TRENDZ INTERIOR • ARCHITECTURAL FITOUTS & INTERIOR DESIGN
              </div>
              <div>
                <strong>Head Office:</strong> Suite # LG - 11 Continental Shopping Mall | <strong>Phone:</strong> +92 300 8594210
              </div>
              <div className="text-slate-400 italic">
                This is a computerized commercial tax invoice valid without physical seal if digitally authenticated.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t no-print">
              <span className="text-xs text-slate-400 italic">
                Official Document generated by Trendz Interior Suite
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice / PDF</span>
                </button>
                <button
                  onClick={() => handleSendInvoiceWhatsApp(viewingInvoice)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
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
