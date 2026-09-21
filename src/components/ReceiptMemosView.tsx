import React, { useState, useMemo } from 'react';
import {
  Receipt,
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
  Edit,
  CheckCircle2,
  Building,
  CreditCard,
  Layers,
  Banknote,
  Filter,
  Pin,
  PinOff,
} from 'lucide-react';
import { PaymentReceipt, Customer, Invoice, Bank } from '../types';
import { TrendzLogo, TrendzLogoMark } from './TrendzLogo';
import { ReceiptImageUploader } from './ReceiptImageUploader';
import { ReceiptThumbnail } from './ReceiptThumbnail';

interface ReceiptMemosViewProps {
  receipts: PaymentReceipt[];
  customers: Customer[];
  invoices: Invoice[];
  banks: Bank[];
  onAddReceipt: (receipt: Omit<PaymentReceipt, 'id'>) => void;
  onUpdateReceipt: (id: number, updated: Partial<PaymentReceipt>) => void;
  onDeleteReceipt: (id: number) => void;
  onOpenWhatsApp: (message: string) => void;
}

// Convert numbers into words helper for professional receipt voucher printing
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '')
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '')
    );
  }

  const intPart = Math.floor(num);
  return `${inWords(intPart)} Rupees Only`;
}

export const ReceiptMemosView: React.FC<ReceiptMemosViewProps> = ({
  receipts,
  customers,
  invoices,
  banks,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<PaymentReceipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentReceipt | null>(null);
  const [freezeColumns, setFreezeColumns] = useState(true);

  // Form State
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [projectName, setProjectName] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentReceipt['payment_mode']>('Cash');
  const [selectedBankId, setSelectedBankId] = useState<number>(banks[0]?.id || 1);
  const [transactionRef, setTransactionRef] = useState('');
  const [receivedBy, setReceivedBy] = useState('Accounts Dept / Trendz Interior');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [receiptImageName, setReceiptImageName] = useState<string | undefined>(undefined);

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter((r) => {
        const matchesSearch =
          r.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.invoice_no && r.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (r.transaction_ref && r.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;
        if (modeFilter === 'all') return true;
        return r.payment_mode === modeFilter;
      })
      .sort((a, b) => new Date(b.receipt_date).getTime() - new Date(a.receipt_date).getTime());
  }, [receipts, searchTerm, modeFilter]);

  const totalCollected = useMemo(
    () => receipts.reduce((s, r) => s + r.amount_received, 0),
    [receipts]
  );

  const totalBankCollected = useMemo(
    () =>
      receipts
        .filter((r) => r.payment_mode !== 'Cash')
        .reduce((s, r) => s + r.amount_received, 0),
    [receipts]
  );

  const totalCashCollected = useMemo(
    () =>
      receipts
        .filter((r) => r.payment_mode === 'Cash')
        .reduce((s, r) => s + r.amount_received, 0),
    [receipts]
  );

  const handleOpenAdd = () => {
    setEditingReceipt(null);
    setReceiptNo(`REC-2024-${(receipts.length + 1).toString().padStart(3, '0')}`);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    const firstCust = customers[0];
    setCustomerName(firstCust?.name || '');
    setCustomerPhone(firstCust?.phone || '');
    setCustomerAddress(firstCust?.address || '');
    setInvoiceNo('');
    setProjectName('');
    setAmountReceived('');
    setPaymentMode('Cash');
    setSelectedBankId(banks[0]?.id || 1);
    setTransactionRef('');
    setReceivedBy('Accounts Dept / Trendz Interior');
    setNotes('Received with thanks against interior architecture & design services');
    setReceiptImage(undefined);
    setReceiptImageName(undefined);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: PaymentReceipt) => {
    setEditingReceipt(rec);
    setReceiptNo(rec.receipt_no);
    setReceiptDate(rec.receipt_date);
    setCustomerName(rec.customer_name);
    setCustomerPhone(rec.customer_phone || '');
    setCustomerAddress(rec.customer_address || '');
    setInvoiceNo(rec.invoice_no || '');
    setProjectName(rec.project_name || '');
    setAmountReceived(rec.amount_received.toString());
    setPaymentMode(rec.payment_mode);
    setSelectedBankId(rec.bank_id || banks[0]?.id || 1);
    setTransactionRef(rec.transaction_ref || '');
    setReceivedBy(rec.received_by || 'Accounts Dept / Trendz Interior');
    setNotes(rec.notes || '');
    setReceiptImage(rec.receipt_image);
    setReceiptImageName(rec.receipt_image_name);
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

  const handleInvoiceSelect = (invNo: string) => {
    setInvoiceNo(invNo);
    const matched = invoices.find((i) => i.invoice_no.toLowerCase() === invNo.toLowerCase());
    if (matched) {
      setCustomerName(matched.customer_name);
      if (matched.customer_phone) setCustomerPhone(matched.customer_phone);
      if (matched.customer_address) setCustomerAddress(matched.customer_address);
      const due = matched.due_amount ?? (matched.grand_total - (matched.paid_amount || 0));
      if (due > 0 && !amountReceived) {
        setAmountReceived(due.toString());
      }
      if (matched.notes) {
        setProjectName(matched.notes);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountReceived);
    if (!receiptNo || !customerName || isNaN(amt) || amt <= 0) {
      alert('Please fill receipt number, customer name, and a valid amount');
      return;
    }

    const currentBank = banks.find((b) => b.id === selectedBankId);

    if (editingReceipt) {
      onUpdateReceipt(editingReceipt.id, {
        receipt_no: receiptNo,
        receipt_date: receiptDate,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        invoice_no: invoiceNo,
        project_name: projectName,
        amount_received: amt,
        payment_mode: paymentMode,
        bank_id: paymentMode !== 'Cash' ? selectedBankId : undefined,
        bank_name: paymentMode !== 'Cash' ? currentBank?.bank_name : undefined,
        transaction_ref: transactionRef,
        received_by: receivedBy,
        notes,
        receipt_image: receiptImage,
        receipt_image_name: receiptImageName,
      });
    } else {
      onAddReceipt({
        receipt_no: receiptNo,
        receipt_date: receiptDate,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        invoice_no: invoiceNo,
        project_name: projectName,
        amount_received: amt,
        payment_mode: paymentMode,
        bank_id: paymentMode !== 'Cash' ? selectedBankId : undefined,
        bank_name: paymentMode !== 'Cash' ? currentBank?.bank_name : undefined,
        transaction_ref: transactionRef,
        received_by: receivedBy,
        notes,
        receipt_image: receiptImage,
        receipt_image_name: receiptImageName,
      });
    }

    setIsAddModalOpen(false);
    setEditingReceipt(null);
  };

  const handleSendReceiptWhatsApp = (rec: PaymentReceipt) => {
    let msg = `*TRENDZ INTERIOR*\n`;
    msg += `*RECEIPT*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall\n`;
    msg += `----------------------------------\n`;
    msg += `*Receipt No:* ${rec.receipt_no}\n`;
    msg += `*Date:* ${rec.receipt_date}\n`;
    msg += `*Received From:* ${rec.customer_name}\n`;
    if (rec.customer_phone) msg += `*Contact:* ${rec.customer_phone}\n`;
    msg += `----------------------------------\n`;
    msg += `*Amount Received:* Rs. ${rec.amount_received.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `*In Words:* ${numberToWords(rec.amount_received)}\n`;
    msg += `*Payment Mode:* ${rec.payment_mode}\n`;
    if (rec.bank_name) msg += `*Bank Account:* ${rec.bank_name}\n`;
    if (rec.transaction_ref) msg += `*Txn / Cheque Ref:* ${rec.transaction_ref}\n`;
    if (rec.invoice_no) msg += `*Against Invoice:* ${rec.invoice_no}\n`;
    if (rec.project_name) msg += `*Project:* ${rec.project_name}\n`;
    if (rec.notes) msg += `*Remarks:* ${rec.notes}\n`;
    msg += `----------------------------------\n`;
    msg += `*Received By:* ${rec.received_by || 'Trendz Interior Finance'}\n`;
    msg += `Thank you for your payment to *TRENDZ INTERIOR*! 🙏\n`;
    msg += `*Address:* Suite # LG - 11 Continental Shopping Mall | *Phone:* +92 300 8594210\n`;
    msg += `_Turnkey Interior Architecture & Bespoke Design Services_`;

    onOpenWhatsApp(msg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              TRENDZ INTERIOR
            </span>
            <span className="text-xs text-slate-400 font-medium">Payment Vouchers & Receipts</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <Receipt className="w-7 h-7 text-purple-600" />
            <span>Payment Receipt Memos</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Official receipt vouchers for received amounts, client WhatsApp receipts, print PDF, and bank sync
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Receipt Memo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
              Total Receipts Collected
            </span>
            <Receipt className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2">
            Rs. {totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-purple-200 mt-1 font-medium">
            {receipts.length} Official Receipt Vouchers Issued
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Bank Transfers & Cheques
            </span>
            <Building className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2">
            Rs. {totalBankCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            Deposited directly to verified corporate accounts
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-950">
              Cash Counter Collections
            </span>
            <Banknote className="w-6 h-6 opacity-60 text-amber-950" />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 text-slate-900">
            Rs. {totalCashCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-950 mt-1 font-medium">
            Direct office desk cash vouchers
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by receipt #, customer, invoice # or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <button
            onClick={() => setFreezeColumns(!freezeColumns)}
            title="Toggle frozen Customer Name and Amount columns when scrolling"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
              freezeColumns
                ? 'bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {freezeColumns ? (
              <>
                <Pin className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                <span>Frozen: Name & Amount (ON)</span>
              </>
            ) : (
              <>
                <PinOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Freeze: OFF</span>
              </>
            )}
          </button>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold bg-white cursor-pointer"
          >
            <option value="all">All Payment Modes ({receipts.length})</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Easypaisa / Jazz Cash">Easypaisa / Jazz Cash</option>
            <option value="Other">Other</option>
          </select>
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            {filteredReceipts.length} Memos Found
          </span>
        </div>
      </div>

      {/* Receipt Memos Table with Freeze Panes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto relative">
          <table className="w-full text-left border-collapse text-sm min-w-[950px]">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs shadow-xs border-b border-slate-200">
              <tr className="text-slate-700 text-xs uppercase font-bold">
                <th
                  className={`py-3.5 px-4 w-28 ${
                    freezeColumns ? 'sticky left-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Receipt #
                </th>
                <th className="py-3.5 px-4 w-28 whitespace-nowrap">Date</th>
                <th
                  className={`py-3.5 px-4 min-w-[200px] ${
                    freezeColumns
                      ? 'sticky left-28 z-30 bg-slate-100 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Name</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Against Inv / Scope</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th
                  className={`py-3.5 px-4 text-right font-black text-emerald-700 w-44 ${
                    freezeColumns
                      ? 'sticky right-36 z-30 bg-slate-100 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount (Rs.)</span>
                    {freezeColumns && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                        Frozen
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`py-3.5 px-4 text-center no-print w-36 ${
                    freezeColumns ? 'sticky right-0 z-30 bg-slate-100' : ''
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/90 transition-colors group">
                    <td
                      className={`py-3 px-4 font-mono font-bold text-purple-700 whitespace-nowrap ${
                        freezeColumns ? 'sticky left-0 z-10 bg-white group-hover:bg-slate-50' : ''
                      }`}
                    >
                      {rec.receipt_no}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono text-xs">
                      {rec.receipt_date}
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        freezeColumns
                          ? 'sticky left-28 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-slate-900">{rec.customer_name}</div>
                        {rec.receipt_image && (
                          <ReceiptThumbnail
                            image={rec.receipt_image}
                            imageName={rec.receipt_image_name}
                            title={`Voucher #${rec.receipt_no}`}
                            size="sm"
                          />
                        )}
                      </div>
                      {rec.transaction_ref && (
                        <div className="text-xs text-slate-400 font-mono">Ref: {rec.transaction_ref}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rec.invoice_no ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                          {rec.invoice_no}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {rec.project_name || 'Direct Advance'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                        {rec.payment_mode === 'Cash' ? (
                          <Banknote className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Building className="w-3 h-3 text-blue-600" />
                        )}
                        <span>{rec.payment_mode}</span>
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-black text-emerald-600 text-base whitespace-nowrap ${
                        freezeColumns
                          ? 'sticky right-36 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]'
                          : ''
                      }`}
                    >
                      Rs. {rec.amount_received.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3 px-4 text-center no-print ${
                        freezeColumns ? 'sticky right-0 z-10 bg-white group-hover:bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingReceipt(rec)}
                          title="View / Print Receipt Memo PDF"
                          className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit Receipt Memo"
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendReceiptWhatsApp(rec)}
                          title="Send via WhatsApp"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete receipt memo: "${rec.receipt_no}"?`)) {
                              onDeleteReceipt(rec.id);
                            }
                          }}
                          title="Delete Receipt Memo"
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
                    No receipt memos found matching the search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Receipt Memo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in my-8">
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 uppercase tracking-widest border border-purple-500/30">
                      RECEIPT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 m-0">
                    {editingReceipt ? `Editing Receipt Voucher: ${editingReceipt.receipt_no}` : 'Issue Official Payment Receipt Memo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingReceipt(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Receipt Date *
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Received From (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    list="receiptCustList"
                    placeholder="Select or enter customer"
                    value={customerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold bg-white"
                  />
                  <datalist id="receiptCustList">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Against Invoice (Optional)
                  </label>
                  <input
                    type="text"
                    list="invoiceNumList"
                    placeholder="e.g. INV-2024-001"
                    value={invoiceNo}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold bg-white"
                  />
                  <datalist id="invoiceNumList">
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.invoice_no}>
                        {inv.customer_name} (Total: Rs. {inv.grand_total.toLocaleString()})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="Site / Office Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
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
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-3 py-2.5 text-base rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 font-black font-mono text-purple-800 bg-white"
                />
                {amountReceived && parseFloat(amountReceived) > 0 && (
                  <div className="text-xs text-purple-700 italic font-semibold mt-1">
                    Amount in words: {numberToWords(parseFloat(amountReceived))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      Deposit Bank Account *
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bank_name} ({b.account_no})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase">
                      Collection Point
                    </label>
                    <div className="p-2 bg-slate-100 rounded text-slate-700 font-semibold text-xs">
                      Main Office Cash Vault
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Transaction / Cheque / UTR Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cheque #440192 or Bank Ref #TX-8820"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Project Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penthouse Living Room Fitout"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
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
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>

              {/* Receipt / Voucher Image Attachment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <ReceiptImageUploader
                  idPrefix="receipt-memo"
                  receiptImage={receiptImage}
                  receiptImageName={receiptImageName}
                  onChange={(img, name) => {
                    setReceiptImage(img);
                    setReceiptImageName(name);
                  }}
                  label="Attach Manual Receipt / Online Bank Transfer Voucher"
                  helperText="Upload physical signed receipt slip, counter receipt, or bank payment screenshot"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingReceipt(null);
                  }}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingReceipt ? 'Update Receipt Memo' : 'Save & Issue Receipt Memo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Memo Printable / PDF Voucher Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-8 space-y-6 my-8 border border-slate-200 print-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-xl bg-black border border-amber-500/40 shadow-sm shrink-0">
                  <TrendzLogoMark size={54} variant="gold" />
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
                    Turnkey Interior Fitouts • Accounts & Official Receipt Voucher
                  </p>
                  <p className="text-2xs text-slate-500 font-mono mt-0.5">
                    Contact: +92 300 8594210 | Email: trendzinterior@gmail.com
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-4 py-1.5 bg-slate-950 text-amber-400 font-serif font-black tracking-[0.25em] text-sm rounded-md shadow-xs uppercase border border-amber-500/40">
                  RECEIPT
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-2">
                  {viewingReceipt.receipt_no}
                </div>
                <div className="text-xs text-slate-500 font-mono">Date: {viewingReceipt.receipt_date}</div>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-bold uppercase w-40">Received With Thanks From:</span>
                  <span className="text-slate-900 font-bold text-sm flex-1 text-right">
                    {viewingReceipt.customer_name}
                  </span>
                </div>
                {viewingReceipt.customer_phone && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Contact:</span>
                    <span>{viewingReceipt.customer_phone}</span>
                  </div>
                )}
                {viewingReceipt.customer_address && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Address / Location:</span>
                    <span>{viewingReceipt.customer_address}</span>
                  </div>
                )}
              </div>

              {/* Amount Box */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-purple-900 block">
                    Amount Received:
                  </span>
                  <div className="text-2xl font-black font-mono text-purple-900 mt-0.5">
                    Rs. {viewingReceipt.amount_received.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-purple-700 font-bold block">In Words:</span>
                  <span className="text-xs font-semibold text-slate-800 italic">
                    {numberToWords(viewingReceipt.amount_received)}
                  </span>
                </div>
              </div>

              {/* Payment Details Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Payment Method:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {viewingReceipt.payment_mode}
                  </span>
                  {viewingReceipt.bank_name && (
                    <span className="text-slate-500 block text-xs">{viewingReceipt.bank_name}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Transaction / Cheque Ref:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                    {viewingReceipt.transaction_ref || 'N/A (Cash Settlement)'}
                  </span>
                </div>
                {viewingReceipt.invoice_no && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Invoice Reference:</span>
                    <span className="font-mono font-bold text-blue-600 text-xs mt-0.5 block">
                      {viewingReceipt.invoice_no}
                    </span>
                  </div>
                )}
                {viewingReceipt.project_name && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Project Scope:</span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5 block">
                      {viewingReceipt.project_name}
                    </span>
                  </div>
                )}
              </div>

              {viewingReceipt.notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                  <strong className="text-slate-900 block mb-0.5">Remarks:</strong>
                  {viewingReceipt.notes}
                </div>
              )}

              {/* Attached Voucher / Receipt Slip Image */}
              {viewingReceipt.receipt_image && (
                <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-purple-900 flex items-center gap-1.5">
                      Attached Physical Slip / Online Voucher:
                    </span>
                    <a
                      href={viewingReceipt.receipt_image}
                      download={viewingReceipt.receipt_image_name || 'voucher-slip.jpg'}
                      className="text-2xs text-purple-700 hover:text-purple-900 underline font-semibold no-print cursor-pointer"
                    >
                      Download Original
                    </a>
                  </div>
                  <div className="flex justify-center bg-white rounded-lg p-2 border border-purple-100">
                    <img
                      src={viewingReceipt.receipt_image}
                      alt="Attached Receipt Voucher"
                      referrerPolicy="no-referrer"
                      className="max-h-56 object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Signature Blocks */}
            <div className="pt-6 flex justify-between items-end border-t text-xs">
              <div className="text-center">
                <div className="w-48 border-b border-slate-400 pb-1 mb-1"></div>
                <span className="text-slate-500 font-medium">Payer / Client Signature</span>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900 font-serif">
                  {viewingReceipt.received_by || 'TRENDZ INTERIOR'}
                </div>
                <span className="text-slate-500 font-medium">Authorized Signature & Stamp</span>
              </div>
            </div>

            {/* Official Document Footer with Address */}
            <div className="border-t border-slate-200 pt-3 text-center text-2xs text-slate-500 space-y-0.5">
              <div className="font-bold tracking-wider text-slate-700 font-serif uppercase">
                TRENDZ INTERIOR • ARCHITECTURAL FITOUTS & OFFICIAL PAYMENT VOUCHER
              </div>
              <div>
                <strong>Head Office:</strong> Suite # LG - 11 Continental Shopping Mall | <strong>Phone:</strong> +92 300 8594210
              </div>
              <div className="text-slate-400 italic">
                Valid computerized official payment receipt memo issued by TRENDZ INTERIOR.
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t no-print">
              <span className="text-xs text-slate-400 italic">
                Official Receipt Memo generated by Trendz Interior Suite
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt / PDF</span>
                </button>
                <button
                  onClick={() => handleSendReceiptWhatsApp(viewingReceipt)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
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
