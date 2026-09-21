import {
  Bank,
  BankTransaction,
  Customer,
  Vendor,
  VendorTransaction,
  Product,
  StockMovement,
  Invoice,
  PaymentReceipt,
  OfficeExpense,
  Project,
  ProjectExpense,
} from '../types';
import { AppDataPayload } from './firebaseSync';

export interface BackupParseSummary {
  fileCount: number;
  invoices: number;
  banks: number;
  bankTransactions: number;
  customers: number;
  vendors: number;
  vendorTransactions: number;
  products: number;
  stockMovements: number;
  receipts: number;
  officeExpenses: number;
  projects: number;
  projectExpenses: number;
  hasMasterPassword: boolean;
}

/**
 * Safely parses any JSON value which might be a stringified string
 */
function safeParseValue(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'string' ? safeParseValue(parsed) : parsed;
    } catch {
      return val;
    }
  }
  return val;
}

/**
 * Categorizes an array of records if user uploads a direct array file (e.g. [ { invoice_no: '...' } ])
 */
function categorizeArray(items: any[]): Partial<AppDataPayload> {
  if (!Array.isArray(items) || items.length === 0) return {};

  const first = items[0];
  if (!first || typeof first !== 'object') return {};

  // Check characteristics of first item
  if ('invoice_no' in first || 'items' in first || 'grand_total' in first) {
    return { invoices: items as Invoice[] };
  }
  if ('receipt_no' in first || 'amount_received' in first) {
    return { receipts: items as PaymentReceipt[] };
  }
  if ('account_no' in first || 'account_name' in first || 'bank_name' in first) {
    return { banks: items as Bank[] };
  }
  if (('debit' in first || 'credit' in first) && 'bank_id' in first) {
    return { bankTransactions: items as BankTransaction[] };
  }
  if ('sale_price' in first || 'barcode' in first || ('current_stock' in first && 'purchase_price' in first)) {
    return { products: items as Product[] };
  }
  if ('movement_type' in first || 'product_id' in first) {
    return { stockMovements: items as StockMovement[] };
  }
  if ('category' in first && 'expense_date' in first && !('project_name' in first)) {
    return { officeExpenses: items as OfficeExpense[] };
  }
  if ('project_name' in first && 'expense_type' in first) {
    return { projectExpenses: items as ProjectExpense[] };
  }
  if ('start_date' in first && ('status' in first || 'contract_value' in first)) {
    return { projects: items as Project[] };
  }
  if ('contact_person' in first || ('email' in first && !('company_name' in first))) {
    return { customers: items as Customer[] };
  }
  if ('vendor_name' in first || ('contact_person' in first && 'payment_terms' in first)) {
    return { vendors: items as Vendor[] };
  }
  if (('trans_type' in first || 'trans_date' in first) && 'vendor_id' in first) {
    return { vendorTransactions: items as VendorTransaction[] };
  }

  return {};
}

/**
 * Extracts all recognized ERP entities from any JSON object, supporting:
 * - Direct AppDataPayload ({ invoices: [...], banks: [...] })
 * - Browser LocalStorage dump ({ ah_invoices: "[...]", ah_banks: "[...]" })
 * - Wrapped structures ({ data: { ... } }, { backup: { ... } }, { erp_data: { ... } })
 * - Mixed snake_case and camelCase keys
 */
export function extractDataFromObject(rawInput: any): Partial<AppDataPayload> {
  if (!rawInput) return {};

  let obj = rawInput;
  if (typeof obj === 'string') {
    try {
      let cleaned = obj.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      obj = JSON.parse(cleaned);
      if (typeof obj === 'string') {
        obj = JSON.parse(obj);
      }
    } catch (e) {
      console.error('Failed to parse string into JSON:', e);
      return {};
    }
  }

  // If input is an array, try categorizing
  if (Array.isArray(obj)) {
    return categorizeArray(obj);
  }

  if (typeof obj !== 'object' || obj === null) return {};

  // Check if data is nested under common container keys
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    obj = { ...obj, ...obj.data };
  }
  if (obj.backup && typeof obj.backup === 'object' && !Array.isArray(obj.backup)) {
    obj = { ...obj, ...obj.backup };
  }
  if (obj.payload && typeof obj.payload === 'object' && !Array.isArray(obj.payload)) {
    obj = { ...obj, ...obj.payload };
  }
  if (obj.localStorage && typeof obj.localStorage === 'object') {
    obj = { ...obj, ...obj.localStorage };
  }

  const result: Partial<AppDataPayload> = {};

  // 1. Invoices
  const rawInvoices = obj.invoices ?? obj.ah_invoices ?? obj.invoice_list;
  if (rawInvoices) {
    const parsed = safeParseValue(rawInvoices);
    if (Array.isArray(parsed)) result.invoices = parsed;
  }

  // 2. Banks
  const rawBanks = obj.banks ?? obj.ah_banks ?? obj.bank_accounts ?? obj.bankAccounts;
  if (rawBanks) {
    const parsed = safeParseValue(rawBanks);
    if (Array.isArray(parsed)) result.banks = parsed;
  }

  // 3. Bank Transactions
  const rawBankTxs =
    obj.bankTransactions ??
    obj.bank_transactions ??
    obj.ah_bank_txs ??
    obj.ah_bankTransactions ??
    obj.ah_bank_transactions ??
    obj.bank_txs;
  if (rawBankTxs) {
    const parsed = safeParseValue(rawBankTxs);
    if (Array.isArray(parsed)) result.bankTransactions = parsed;
  }

  // 4. Customers
  const rawCustomers = obj.customers ?? obj.ah_customers ?? obj.clients ?? obj.customer_list;
  if (rawCustomers) {
    const parsed = safeParseValue(rawCustomers);
    if (Array.isArray(parsed)) result.customers = parsed;
  }

  // 5. Vendors
  const rawVendors = obj.vendors ?? obj.ah_vendors ?? obj.suppliers ?? obj.vendor_list;
  if (rawVendors) {
    const parsed = safeParseValue(rawVendors);
    if (Array.isArray(parsed)) result.vendors = parsed;
  }

  // 6. Vendor Transactions
  const rawVendorTxs =
    obj.vendorTransactions ??
    obj.vendor_transactions ??
    obj.ah_vendor_txs ??
    obj.ah_vendorTransactions ??
    obj.ah_vendor_transactions ??
    obj.vendor_txs;
  if (rawVendorTxs) {
    const parsed = safeParseValue(rawVendorTxs);
    if (Array.isArray(parsed)) result.vendorTransactions = parsed;
  }

  // 7. Products
  const rawProducts = obj.products ?? obj.ah_products ?? obj.inventory ?? obj.product_list;
  if (rawProducts) {
    const parsed = safeParseValue(rawProducts);
    if (Array.isArray(parsed)) result.products = parsed;
  }

  // 8. Stock Movements
  const rawStockMovements =
    obj.stockMovements ??
    obj.stock_movements ??
    obj.ah_stock_movements ??
    obj.ah_stockMovements ??
    obj.inventory_movements;
  if (rawStockMovements) {
    const parsed = safeParseValue(rawStockMovements);
    if (Array.isArray(parsed)) result.stockMovements = parsed;
  }

  // 9. Receipts
  const rawReceipts =
    obj.receipts ??
    obj.paymentReceipts ??
    obj.payment_receipts ??
    obj.ah_receipts ??
    obj.ah_payment_receipts ??
    obj.ah_paymentReceipts;
  if (rawReceipts) {
    const parsed = safeParseValue(rawReceipts);
    if (Array.isArray(parsed)) result.receipts = parsed;
  }

  // 10. Office Expenses
  const rawOfficeExpenses =
    obj.officeExpenses ??
    obj.office_expenses ??
    obj.ah_office_expenses ??
    obj.ah_officeExpenses ??
    obj.expenses;
  if (rawOfficeExpenses) {
    const parsed = safeParseValue(rawOfficeExpenses);
    if (Array.isArray(parsed)) result.officeExpenses = parsed;
  }

  // 11. Projects
  const rawProjects = obj.projects ?? obj.ah_projects ?? obj.project_list;
  if (rawProjects) {
    const parsed = safeParseValue(rawProjects);
    if (Array.isArray(parsed)) result.projects = parsed;
  }

  // 12. Project Expenses
  const rawProjectExpenses =
    obj.projectExpenses ??
    obj.project_expenses ??
    obj.ah_project_expenses ??
    obj.ah_projectExpenses;
  if (rawProjectExpenses) {
    const parsed = safeParseValue(rawProjectExpenses);
    if (Array.isArray(parsed)) result.projectExpenses = parsed;
  }

  // 13. Master Password
  const rawPwd = obj.masterPassword ?? obj.trendz_accounts_master_pwd ?? obj.master_password;
  if (rawPwd && typeof rawPwd === 'string') {
    result.masterPassword = rawPwd;
  }

  return result;
}

/**
 * Merges two arrays of records, deduplicating by specific unique keys
 */
function mergeEntities<T extends Record<string, any>>(
  base: T[] = [],
  incoming: T[] = [],
  primaryKey: keyof T,
  secondaryKey?: keyof T
): T[] {
  if (!incoming || incoming.length === 0) return base;
  if (!base || base.length === 0) return incoming;

  const map = new Map<string, T>();

  // Add base items
  base.forEach((item) => {
    const key = String(item[primaryKey] || '') + (secondaryKey ? `_${String(item[secondaryKey] || '')}` : '');
    if (key) map.set(key, item);
  });

  // Incoming items overwrite or add
  incoming.forEach((item) => {
    const key = String(item[primaryKey] || '') + (secondaryKey ? `_${String(item[secondaryKey] || '')}` : '');
    if (key) {
      map.set(key, item);
    } else {
      map.set(String(Math.random()), item);
    }
  });

  return Array.from(map.values());
}

/**
 * Combines parsed incoming records with existing app data
 */
export function mergeAppData(
  current: AppDataPayload,
  incoming: Partial<AppDataPayload>
): AppDataPayload {
  return {
    banks: incoming.banks ? mergeEntities(current.banks, incoming.banks, 'account_no', 'bank_name') : current.banks,
    bankTransactions: incoming.bankTransactions
      ? mergeEntities(current.bankTransactions, incoming.bankTransactions, 'id')
      : current.bankTransactions,
    customers: incoming.customers
      ? mergeEntities(current.customers, incoming.customers, 'name', 'phone')
      : current.customers,
    vendors: incoming.vendors
      ? mergeEntities(current.vendors, incoming.vendors, 'name', 'phone')
      : current.vendors,
    vendorTransactions: incoming.vendorTransactions
      ? mergeEntities(current.vendorTransactions, incoming.vendorTransactions, 'id')
      : current.vendorTransactions,
    products: incoming.products
      ? mergeEntities(current.products, incoming.products, 'name', 'barcode')
      : current.products,
    stockMovements: incoming.stockMovements
      ? mergeEntities(current.stockMovements, incoming.stockMovements, 'id')
      : current.stockMovements,
    invoices: incoming.invoices
      ? mergeEntities(current.invoices, incoming.invoices, 'invoice_no')
      : current.invoices,
    receipts: incoming.receipts
      ? mergeEntities(current.receipts, incoming.receipts, 'receipt_no')
      : current.receipts,
    officeExpenses: incoming.officeExpenses
      ? mergeEntities(current.officeExpenses, incoming.officeExpenses, 'id')
      : current.officeExpenses,
    projects: incoming.projects
      ? mergeEntities(current.projects, incoming.projects, 'name')
      : current.projects,
    projectExpenses: incoming.projectExpenses
      ? mergeEntities(current.projectExpenses, incoming.projectExpenses, 'id')
      : current.projectExpenses,
    masterPassword: incoming.masterPassword || current.masterPassword || 'trendz123',
  };
}

/**
 * Reads a single File object into text using Promise
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Handles uploading ONE or MULTIPLE files simultaneously!
 * Reads all files, extracts all records, merges them together, and produces a complete payload and summary.
 */
export async function parseMultipleBackupFiles(
  files: FileList | File[],
  currentData: AppDataPayload
): Promise<{ mergedData: AppDataPayload; summary: BackupParseSummary }> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    throw new Error('No file was selected.');
  }

  let accumulated = { ...currentData };
  let totalInvoicesFound = 0;
  let totalBanksFound = 0;
  let totalBankTxsFound = 0;
  let totalCustomersFound = 0;
  let totalVendorsFound = 0;
  let totalVendorTxsFound = 0;
  let totalProductsFound = 0;
  let totalStockMovementsFound = 0;
  let totalReceiptsFound = 0;
  let totalOfficeExpensesFound = 0;
  let totalProjectsFound = 0;
  let totalProjectExpensesFound = 0;
  let hasMasterPassword = false;

  for (const file of fileArray) {
    try {
      const text = await readFileAsText(file);
      const extracted = extractDataFromObject(text);

      if (extracted.invoices) totalInvoicesFound += extracted.invoices.length;
      if (extracted.banks) totalBanksFound += extracted.banks.length;
      if (extracted.bankTransactions) totalBankTxsFound += extracted.bankTransactions.length;
      if (extracted.customers) totalCustomersFound += extracted.customers.length;
      if (extracted.vendors) totalVendorsFound += extracted.vendors.length;
      if (extracted.vendorTransactions) totalVendorTxsFound += extracted.vendorTransactions.length;
      if (extracted.products) totalProductsFound += extracted.products.length;
      if (extracted.stockMovements) totalStockMovementsFound += extracted.stockMovements.length;
      if (extracted.receipts) totalReceiptsFound += extracted.receipts.length;
      if (extracted.officeExpenses) totalOfficeExpensesFound += extracted.officeExpenses.length;
      if (extracted.projects) totalProjectsFound += extracted.projects.length;
      if (extracted.projectExpenses) totalProjectExpensesFound += extracted.projectExpenses.length;
      if (extracted.masterPassword) hasMasterPassword = true;

      // Merge into accumulated state
      accumulated = mergeAppData(accumulated, extracted);
    } catch (err) {
      console.warn(`Error reading file ${file.name}:`, err);
    }
  }

  const grandTotalItems =
    totalInvoicesFound +
    totalBanksFound +
    totalBankTxsFound +
    totalCustomersFound +
    totalVendorsFound +
    totalVendorTxsFound +
    totalProductsFound +
    totalStockMovementsFound +
    totalReceiptsFound +
    totalOfficeExpensesFound +
    totalProjectsFound +
    totalProjectExpensesFound;

  if (grandTotalItems === 0 && !hasMasterPassword) {
    throw new Error(
      'None of the uploaded files contained recognizable Trendz Accounts data. Please check your JSON files.'
    );
  }

  const summary: BackupParseSummary = {
    fileCount: fileArray.length,
    invoices: totalInvoicesFound,
    banks: totalBanksFound,
    bankTransactions: totalBankTxsFound,
    customers: totalCustomersFound,
    vendors: totalVendorsFound,
    vendorTransactions: totalVendorTxsFound,
    products: totalProductsFound,
    stockMovements: totalStockMovementsFound,
    receipts: totalReceiptsFound,
    officeExpenses: totalOfficeExpensesFound,
    projects: totalProjectsFound,
    projectExpenses: totalProjectExpensesFound,
    hasMasterPassword,
  };

  return { mergedData: accumulated, summary };
}
