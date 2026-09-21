export interface Bank {
  id: number;
  bank_name: string;
  account_no: string;
  branch: string;
  holder_name: string;
  open_date: string;
  opening_balance: number;
}

export interface BankTransaction {
  id: number;
  bank_id: number;
  trans_date: string;
  description: string;
  debit: number; // Deposit (+)
  credit: number; // Withdrawal / Expense (-)
  receipt_image?: string; // Optional voucher/receipt image (Data URL)
  receipt_image_name?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface Vendor {
  id: number;
  name: string;
  company_name: string;
  phone: string;
  address: string;
  email: string;
}

export interface VendorTransaction {
  id: number;
  vendor_id: number;
  trans_date: string;
  description: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
  trans_type: 'debit' | 'credit';
  receipt_image?: string; // Optional voucher/bill photo
  receipt_image_name?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_level: number;
  location: string;
  supplier_id: number | null;
  supplier_name?: string;
  barcode: string;
  created_date?: string;
  last_updated?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_date: string;
  movement_type: 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out';
  quantity: number;
  reference_type: string;
  previous_stock: number;
  new_stock: number;
  notes: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  discount: number;
  tax: number;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  advance_amount?: number;
  tax_deduction?: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
  items: InvoiceItem[];
  notes?: string;
}

export type PaymentMode = 'Cash' | 'Cheque' | 'Easypaisa / Jazz Cash' | 'Other' | 'Bank Transfer' | 'UPI / Online' | 'Credit / Debit Card';

export interface PaymentReceipt {
  id: number;
  receipt_no: string;
  receipt_date: string;
  invoice_id?: number;
  invoice_no?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  amount_received: number;
  payment_mode: PaymentMode;
  bank_id?: number;
  bank_name?: string;
  transaction_ref?: string; // Cheque #, Trx ID, Txn Ref
  received_by?: string;
  notes?: string;
  project_name?: string;
  receipt_image?: string; // Optional manual receipt slip or online voucher
  receipt_image_name?: string;
}

// Office Expenses Schema
export interface OfficeExpense {
  id: number;
  expense_date: string;
  category: 'Rent' | 'Utilities' | 'Salaries & Wages' | 'Internet & Tech' | 'Office Supplies' | 'Tea & Pantry' | 'Maintenance & Repairs' | 'Printing & Stationery' | 'Miscellaneous';
  description: string;
  paid_to: string;
  payment_method: 'Bank Transfer' | 'Cash / Petty Cash' | 'Cheque' | 'Credit / Debit Card' | 'UPI / Online' | 'Online Transfer';
  bank_id?: number;
  bill_no?: string;
  amount: number;
  notes?: string;
  created_by?: string;
  receipt_image?: string; // Optional bill, voucher, or payment receipt image
  receipt_image_name?: string;
}

// Project Expenses Schema
export interface Project {
  id: number;
  name: string;
  client_name: string;
  location: string;
  budget: number;
  start_date: string;
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Planning';
}

export interface ProjectExpense {
  id: number;
  project_id: number;
  project_name?: string;
  expense_date: string;
  expense_type: 'Raw Materials' | 'Labor & Subcontractors' | 'Equipment & Machinery' | 'Site Logistics & Fuel' | 'Permits & Compliance' | 'Safety & PPE' | 'Site Overhead';
  description: string;
  contractor_supplier: string;
  voucher_no?: string;
  payment_method: 'Bank Transfer' | 'Cash / Petty Cash' | 'Cheque' | 'Credit / Debit Card' | 'UPI / Online' | 'Online Transfer';
  bank_id?: number;
  amount: number;
  notes?: string;
  receipt_image?: string; // Optional contractor voucher or receipt slip
  receipt_image_name?: string;
}

export type ActiveTab = 
  | 'banks' 
  | 'manage_banks' 
  | 'bank_dashboard' 
  | 'customers' 
  | 'vendors' 
  | 'products' 
  | 'invoices' 
  | 'receipts'
  | 'receipt_memos'
  | 'office_expenses' 
  | 'project_expenses'
  | 'backup';
