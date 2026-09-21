import React, { useState, useEffect } from 'react';
import {
  Bank,
  BankTransaction,
  Customer,
  Vendor,
  VendorTransaction,
  Product,
  StockMovement,
  Invoice,
  OfficeExpense,
  Project,
  ProjectExpense,
  PaymentReceipt,
  ActiveTab,
} from './types';
import {
  initialBanks,
  initialBankTransactions,
  initialCustomers,
  initialVendors,
  initialVendorTransactions,
  initialProducts,
  initialStockMovements,
  initialInvoices,
  initialOfficeExpenses,
  initialProjects,
  initialProjectExpenses,
  initialPaymentReceipts,
} from './mockData';
import { Sidebar } from './components/Sidebar';
import { OfficeExpensesView } from './components/OfficeExpensesView';
import { ProjectExpensesView } from './components/ProjectExpensesView';
import { BankStatementsView } from './components/BankStatementsView';
import { ManageBanksView } from './components/ManageBanksView';
import { BankDashboardView } from './components/BankDashboardView';
import { CustomersView } from './components/CustomersView';
import { VendorsView } from './components/VendorsView';
import { ProductsView } from './components/ProductsView';
import { InvoicesView } from './components/InvoicesView';
import { ReceiptMemosView } from './components/ReceiptMemosView';
import { WhatsAppModal } from './components/WhatsAppModal';
import { AuthLockScreen } from './components/AuthLockScreen';
import { DataBackupModal } from './components/DataBackupModal';
import { BackupRestoreView } from './components/BackupRestoreView';
import {
  subscribeToCloudData,
  saveToCloudData,
  AppDataPayload,
  fetchCurrentCloudData,
} from './services/firebaseSync';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('trendz_auth_unlocked') === 'true';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');
  const [whatsAppMsg, setWhatsAppMsg] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Cloud Real-Time Sync Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const isRemoteUpdateRef = React.useRef(false);
  const isInitialLoadedRef = React.useRef(false);

  // Persistent States
  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('ah_banks');
    return saved ? JSON.parse(saved) : initialBanks;
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('ah_bank_txs');
    return saved ? JSON.parse(saved) : initialBankTransactions;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('ah_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('ah_vendors');
    return saved ? JSON.parse(saved) : initialVendors;
  });

  const [vendorTransactions, setVendorTransactions] = useState<VendorTransaction[]>(() => {
    const saved = localStorage.getItem('ah_vendor_txs');
    return saved ? JSON.parse(saved) : initialVendorTransactions;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ah_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('ah_stock_movements');
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ah_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem('ah_receipts');
    return saved ? JSON.parse(saved) : initialPaymentReceipts;
  });

  const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>(() => {
    const saved = localStorage.getItem('ah_office_expenses');
    return saved ? JSON.parse(saved) : initialOfficeExpenses;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ah_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>(() => {
    const saved = localStorage.getItem('ah_project_expenses');
    return saved ? JSON.parse(saved) : initialProjectExpenses;
  });

  // 1. Setup Real-time Firebase Firestore listener
  useEffect(() => {
    setCloudSyncStatus('syncing');

    const unsubscribe = subscribeToCloudData(
      (cloudData) => {
        if (cloudData && (cloudData.invoices || cloudData.banks || cloudData.customers || cloudData.officeExpenses)) {
          // Flag remote update to avoid echo loop back to cloud
          isRemoteUpdateRef.current = true;

          if (cloudData.banks) setBanks(cloudData.banks);
          if (cloudData.bankTransactions) setBankTransactions(cloudData.bankTransactions);
          if (cloudData.customers) setCustomers(cloudData.customers);
          if (cloudData.vendors) setVendors(cloudData.vendors);
          if (cloudData.vendorTransactions) setVendorTransactions(cloudData.vendorTransactions);
          if (cloudData.products) setProducts(cloudData.products);
          if (cloudData.stockMovements) setStockMovements(cloudData.stockMovements);
          if (cloudData.invoices) setInvoices(cloudData.invoices);
          if (cloudData.receipts) setReceipts(cloudData.receipts);
          if (cloudData.officeExpenses) setOfficeExpenses(cloudData.officeExpenses);
          if (cloudData.projects) setProjects(cloudData.projects);
          if (cloudData.projectExpenses) setProjectExpenses(cloudData.projectExpenses);

          if (cloudData.masterPassword) {
            localStorage.setItem('trendz_accounts_master_pwd', cloudData.masterPassword);
          }

          setCloudSyncStatus('synced');
          setLastSyncTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        } else {
          // If the cloud is fresh and empty, upload the local dataset (e.g. from accountant's laptop)
          saveToCloudData({
            banks,
            bankTransactions,
            customers,
            vendors,
            vendorTransactions,
            products,
            stockMovements,
            invoices,
            receipts,
            officeExpenses,
            projects,
            projectExpenses,
            masterPassword: localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123',
          }).then(() => {
            setCloudSyncStatus('synced');
            setLastSyncTime(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
          });
        }
        isInitialLoadedRef.current = true;
      },
      (err) => {
        console.warn('Real-time sync error:', err);
        setCloudSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Sync local changes back to Cloud (Debounced)
  useEffect(() => {
    // Save to local storage
    localStorage.setItem('ah_banks', JSON.stringify(banks));
    localStorage.setItem('ah_bank_txs', JSON.stringify(bankTransactions));
    localStorage.setItem('ah_customers', JSON.stringify(customers));
    localStorage.setItem('ah_vendors', JSON.stringify(vendors));
    localStorage.setItem('ah_vendor_txs', JSON.stringify(vendorTransactions));
    localStorage.setItem('ah_products', JSON.stringify(products));
    localStorage.setItem('ah_stock_movements', JSON.stringify(stockMovements));
    localStorage.setItem('ah_stockMovements', JSON.stringify(stockMovements));
    localStorage.setItem('ah_invoices', JSON.stringify(invoices));
    localStorage.setItem('ah_receipts', JSON.stringify(receipts));
    localStorage.setItem('ah_office_expenses', JSON.stringify(officeExpenses));
    localStorage.setItem('ah_projects', JSON.stringify(projects));
    localStorage.setItem('ah_project_expenses', JSON.stringify(projectExpenses));

    // If change came from remote snapshot, skip re-uploading
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (!isInitialLoadedRef.current) return;

    setCloudSyncStatus('syncing');
    const timer = setTimeout(() => {
      saveToCloudData({
        banks,
        bankTransactions,
        customers,
        vendors,
        vendorTransactions,
        products,
        stockMovements,
        invoices,
        receipts,
        officeExpenses,
        projects,
        projectExpenses,
        masterPassword: localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123',
      })
        .then((success) => {
          if (success) {
            setCloudSyncStatus('synced');
            setLastSyncTime(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
          } else {
            setCloudSyncStatus('error');
          }
        })
        .catch(() => setCloudSyncStatus('error'));
    }, 600);

    return () => clearTimeout(timer);
  }, [
    banks,
    bankTransactions,
    customers,
    vendors,
    vendorTransactions,
    products,
    stockMovements,
    invoices,
    receipts,
    officeExpenses,
    projects,
    projectExpenses,
  ]);

  // Force Manual Push / Pull to Cloud
  const handleForceSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      const cloud = await fetchCurrentCloudData();
      if (cloud && (cloud.invoices || cloud.banks)) {
        isRemoteUpdateRef.current = true;
        if (cloud.banks) setBanks(cloud.banks);
        if (cloud.bankTransactions) setBankTransactions(cloud.bankTransactions);
        if (cloud.customers) setCustomers(cloud.customers);
        if (cloud.vendors) setVendors(cloud.vendors);
        if (cloud.vendorTransactions) setVendorTransactions(cloud.vendorTransactions);
        if (cloud.products) setProducts(cloud.products);
        if (cloud.stockMovements) setStockMovements(cloud.stockMovements);
        if (cloud.invoices) setInvoices(cloud.invoices);
        if (cloud.receipts) setReceipts(cloud.receipts);
        if (cloud.officeExpenses) setOfficeExpenses(cloud.officeExpenses);
        if (cloud.projects) setProjects(cloud.projects);
        if (cloud.projectExpenses) setProjectExpenses(cloud.projectExpenses);
        setCloudSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        await saveToCloudData({
          banks,
          bankTransactions,
          customers,
          vendors,
          vendorTransactions,
          products,
          stockMovements,
          invoices,
          receipts,
          officeExpenses,
          projects,
          projectExpenses,
          masterPassword: localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123',
        });
        setCloudSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error(err);
      setCloudSyncStatus('error');
    }
  };

  // ============ HANDLERS ============

  const handleRestoreData = (restored: AppDataPayload) => {
    isRemoteUpdateRef.current = true;
    if (restored.banks) {
      setBanks(restored.banks);
      localStorage.setItem('ah_banks', JSON.stringify(restored.banks));
    }
    if (restored.bankTransactions) {
      setBankTransactions(restored.bankTransactions);
      localStorage.setItem('ah_bank_txs', JSON.stringify(restored.bankTransactions));
    }
    if (restored.customers) {
      setCustomers(restored.customers);
      localStorage.setItem('ah_customers', JSON.stringify(restored.customers));
    }
    if (restored.vendors) {
      setVendors(restored.vendors);
      localStorage.setItem('ah_vendors', JSON.stringify(restored.vendors));
    }
    if (restored.vendorTransactions) {
      setVendorTransactions(restored.vendorTransactions);
      localStorage.setItem('ah_vendor_txs', JSON.stringify(restored.vendorTransactions));
    }
    if (restored.products) {
      setProducts(restored.products);
      localStorage.setItem('ah_products', JSON.stringify(restored.products));
    }
    if (restored.stockMovements) {
      setStockMovements(restored.stockMovements);
      localStorage.setItem('ah_stock_movements', JSON.stringify(restored.stockMovements));
      localStorage.setItem('ah_stockMovements', JSON.stringify(restored.stockMovements));
    }
    if (restored.invoices) {
      setInvoices(restored.invoices);
      localStorage.setItem('ah_invoices', JSON.stringify(restored.invoices));
    }
    if (restored.receipts) {
      setReceipts(restored.receipts);
      localStorage.setItem('ah_receipts', JSON.stringify(restored.receipts));
    }
    if (restored.officeExpenses) {
      setOfficeExpenses(restored.officeExpenses);
      localStorage.setItem('ah_office_expenses', JSON.stringify(restored.officeExpenses));
    }
    if (restored.projects) {
      setProjects(restored.projects);
      localStorage.setItem('ah_projects', JSON.stringify(restored.projects));
    }
    if (restored.projectExpenses) {
      setProjectExpenses(restored.projectExpenses);
      localStorage.setItem('ah_project_expenses', JSON.stringify(restored.projectExpenses));
    }
    if (restored.masterPassword) {
      localStorage.setItem('trendz_accounts_master_pwd', restored.masterPassword);
    }
  };

  // Banks
  const handleAddBank = (bank: Omit<Bank, 'id'>) => {
    const newBank: Bank = { ...bank, id: Date.now() };
    setBanks((prev) => [...prev, newBank]);
    if (bank.opening_balance > 0) {
      setBankTransactions((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          bank_id: newBank.id,
          trans_date: bank.open_date,
          description: 'Opening Balance',
          debit: bank.opening_balance,
          credit: 0,
        },
      ]);
    }
  };

  const handleDeleteBank = (id: number) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
    setBankTransactions((prev) => prev.filter((t) => t.bank_id !== id));
  };

  const handleAddBankTx = (tx: Omit<BankTransaction, 'id'>) => {
    setBankTransactions((prev) => [...prev, { ...tx, id: Date.now() }]);
  };

  const handleUpdateBankTx = (id: number, updated: Partial<BankTransaction>) => {
    setBankTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteBankTx = (id: number) => {
    setBankTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Customers
  const handleAddCustomer = (c: Omit<Customer, 'id'>) => {
    setCustomers((prev) => [...prev, { ...c, id: Date.now() }]);
  };

  const handleUpdateCustomer = (id: number, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDeleteCustomer = (id: number) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Vendors
  const handleAddVendor = (v: Omit<Vendor, 'id'>) => {
    setVendors((prev) => [...prev, { ...v, id: Date.now() }]);
  };

  const handleUpdateVendor = (id: number, updated: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v))
    );
  };

  const handleDeleteVendor = (id: number) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setVendorTransactions((prev) => prev.filter((t) => t.vendor_id !== id));
  };

  const handleAddVendorTx = (tx: Omit<VendorTransaction, 'id'>) => {
    setVendorTransactions((prev) => [...prev, { ...tx, id: Date.now() }]);

    // If purchase (debit) with description matching a product, update stock
    if (tx.trans_type === 'debit' && tx.qty > 0) {
      const matched = products.find(
        (p) => p.name.toLowerCase() === tx.description.toLowerCase()
      );
      if (matched) {
        const prevStock = matched.current_stock;
        const newStock = prevStock + tx.qty;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === matched.id ? { ...p, current_stock: newStock } : p
          )
        );
        setStockMovements((prev) => [
          {
            id: Date.now() + 2,
            product_id: matched.id,
            movement_date: tx.trans_date,
            movement_type: 'purchase',
            quantity: tx.qty,
            reference_type: 'vendor_purchase',
            previous_stock: prevStock,
            new_stock: newStock,
            notes: `Purchased from vendor: ${tx.description}`,
          },
          ...prev,
        ]);
      }
    }
  };

  const handleUpdateVendorTx = (id: number, updated: Partial<VendorTransaction>) => {
    setVendorTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteVendorTx = (id: number) => {
    setVendorTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Stock / Products
  const handleAddProduct = (p: Omit<Product, 'id'>) => {
    setProducts((prev) => [...prev, { ...p, id: Date.now() }]);
  };

  const handleUpdateProduct = (id: number, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setStockMovements((prev) => prev.filter((m) => m.product_id !== id));
  };

  const handleAdjustStock = (productId: number, quantity: number, notes: string) => {
    const matched = products.find((p) => p.id === productId);
    if (!matched) return;

    const prevStock = matched.current_stock;
    const newStock = prevStock + quantity;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              current_stock: newStock,
              last_updated: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
          : p
      )
    );

    setStockMovements((prev) => [
      {
        id: Date.now(),
        product_id: productId,
        movement_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        movement_type: quantity > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity,
        reference_type: 'manual_adjustment',
        previous_stock: prevStock,
        new_stock: newStock,
        notes: notes || 'Manual audit stock adjustment',
      },
      ...prev,
    ]);
  };

  // Invoices
  const handleSaveInvoice = (
    inv: Omit<Invoice, 'id'>,
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
  ) => {
    const newInv: Invoice = { ...inv, id: Date.now() };
    setInvoices((prev) => [newInv, ...prev]);

    // Check if customer exists, else create
    const exists = customers.some(
      (c) => c.name.toLowerCase() === inv.customer_name.toLowerCase()
    );
    if (!exists) {
      setCustomers((prev) => [
        ...prev,
        {
          id: Date.now() + 5,
          name: inv.customer_name,
          phone: inv.customer_phone || 'N/A',
          address: inv.customer_address || 'N/A',
          email: 'N/A',
        },
      ]);
    }

    // If client provided payment at time of invoice creation
    if (paymentDetails && paymentDetails.amount_received > 0) {
      const bankObj = banks.find((b) => b.id === paymentDetails.bank_id);
      const newReceipt: PaymentReceipt = {
        id: Date.now() + 15,
        receipt_no: paymentDetails.receipt_no || `REC-${Date.now().toString().slice(-4)}`,
        receipt_date: paymentDetails.receipt_date || newInv.invoice_date,
        customer_name: newInv.customer_name,
        customer_phone: newInv.customer_phone,
        customer_address: newInv.customer_address,
        invoice_id: newInv.id,
        invoice_no: newInv.invoice_no,
        project_name: newInv.notes,
        amount_received: paymentDetails.amount_received,
        payment_mode: paymentDetails.payment_mode,
        bank_id: paymentDetails.bank_id,
        bank_name: bankObj?.bank_name,
        transaction_ref: paymentDetails.transaction_ref,
        received_by: paymentDetails.received_by || 'Accounts Dept / Trendz Interior',
        notes: paymentDetails.notes || `Payment received at time of invoice #${newInv.invoice_no}`,
      };

      setReceipts((prev) => [newReceipt, ...prev]);

      // If deposited to bank, record in Bank Transactions Ledger
      if (paymentDetails.bank_id && paymentDetails.payment_mode !== 'Cash') {
        setBankTransactions((prev) => [
          ...prev,
          {
            id: Date.now() + 55,
            bank_id: paymentDetails.bank_id!,
            trans_date: paymentDetails.receipt_date || newInv.invoice_date,
            description: `Client Payment: ${newInv.customer_name} (Inv #${newInv.invoice_no} | Receipt #${newReceipt.receipt_no})`,
            debit: paymentDetails.amount_received,
            credit: 0,
          },
        ]);
      }
    }

    // Auto deduct stock for items matching catalog
    inv.items.forEach((item) => {
      const matched = products.find(
        (p) =>
          p.name.toLowerCase().includes(item.description.toLowerCase()) ||
          item.description.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matched) {
        const prevStock = matched.current_stock;
        const newStock = prevStock - item.qty;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === matched.id ? { ...p, current_stock: newStock } : p
          )
        );
        setStockMovements((prev) => [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            product_id: matched.id,
            movement_date: inv.invoice_date,
            movement_type: 'sale',
            quantity: -item.qty,
            reference_type: 'invoice_sale',
            previous_stock: prevStock,
            new_stock: newStock,
            notes: `Sold on Invoice #${inv.invoice_no}`,
          },
          ...prev,
        ]);
      }
    });
  };

  const handleUpdateInvoice = (
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
  ) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
    );

    // If new additional payment was entered during invoice update
    if (paymentDetails && paymentDetails.amount_received > 0) {
      const targetInvoice = invoices.find((i) => i.id === id);
      const bankObj = banks.find((b) => b.id === paymentDetails.bank_id);
      const newReceipt: PaymentReceipt = {
        id: Date.now() + 16,
        receipt_no: paymentDetails.receipt_no || `REC-${Date.now().toString().slice(-4)}`,
        receipt_date: paymentDetails.receipt_date,
        customer_name: updated.customer_name || targetInvoice?.customer_name || 'Client',
        customer_phone: updated.customer_phone || targetInvoice?.customer_phone,
        customer_address: updated.customer_address || targetInvoice?.customer_address,
        invoice_id: id,
        invoice_no: updated.invoice_no || targetInvoice?.invoice_no,
        project_name: updated.notes || targetInvoice?.notes,
        amount_received: paymentDetails.amount_received,
        payment_mode: paymentDetails.payment_mode,
        bank_id: paymentDetails.bank_id,
        bank_name: bankObj?.bank_name,
        transaction_ref: paymentDetails.transaction_ref,
        received_by: paymentDetails.received_by || 'Accounts Dept / Trendz Interior',
        notes: paymentDetails.notes || `Payment recorded during invoice update #${updated.invoice_no || targetInvoice?.invoice_no}`,
      };

      setReceipts((prev) => [newReceipt, ...prev]);

      if (paymentDetails.bank_id && paymentDetails.payment_mode !== 'Cash') {
        setBankTransactions((prev) => [
          ...prev,
          {
            id: Date.now() + 56,
            bank_id: paymentDetails.bank_id!,
            trans_date: paymentDetails.receipt_date,
            description: `Client Payment: ${newReceipt.customer_name} (Inv #${newReceipt.invoice_no} | Receipt #${newReceipt.receipt_no})`,
            debit: paymentDetails.amount_received,
            credit: 0,
          },
        ]);
      }
    }
  };

  const handleDeleteInvoice = (id: number) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // Payment Receive on Invoice -> updates invoice, creates receipt memo, and syncs bank
  const handleReceiveInvoicePayment = (payment: {
    invoice_id: number;
    receipt_no: string;
    receipt_date: string;
    amount_received: number;
    payment_mode: PaymentReceipt['payment_mode'];
    bank_id?: number;
    transaction_ref?: string;
    received_by?: string;
    notes?: string;
  }) => {
    const targetInvoice = invoices.find((i) => i.id === payment.invoice_id);
    if (!targetInvoice) return;

    const previousPaid = targetInvoice.paid_amount || 0;
    const newPaid = previousPaid + payment.amount_received;
    const newDue = Math.max(0, targetInvoice.grand_total - newPaid);
    const newStatus: Invoice['status'] =
      newDue <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    // 1. Update Invoice status & amounts
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === payment.invoice_id
          ? {
              ...i,
              paid_amount: newPaid,
              due_amount: newDue,
              status: newStatus,
            }
          : i
      )
    );

    const bankObj = banks.find((b) => b.id === payment.bank_id);

    // 2. Create Payment Receipt Record
    const newReceipt: PaymentReceipt = {
      id: Date.now(),
      receipt_no: payment.receipt_no,
      receipt_date: payment.receipt_date,
      customer_name: targetInvoice.customer_name,
      customer_phone: targetInvoice.customer_phone,
      customer_address: targetInvoice.customer_address,
      invoice_id: targetInvoice.id,
      invoice_no: targetInvoice.invoice_no,
      project_name: targetInvoice.notes,
      amount_received: payment.amount_received,
      payment_mode: payment.payment_mode,
      bank_id: payment.bank_id,
      bank_name: bankObj?.bank_name,
      transaction_ref: payment.transaction_ref,
      received_by: payment.received_by || 'Accounts Dept / Trendz Interior',
      notes: payment.notes || `Payment against invoice #${targetInvoice.invoice_no}`,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    // 3. If paid via Bank, automatically add Deposit (Debit) to Bank Statement Ledger
    if (payment.bank_id && payment.payment_mode !== 'Cash') {
      setBankTransactions((prev) => [
        ...prev,
        {
          id: Date.now() + 50,
          bank_id: payment.bank_id!,
          trans_date: payment.receipt_date,
          description: `Client Payment: ${targetInvoice.customer_name} (Inv #${targetInvoice.invoice_no} | Receipt #${payment.receipt_no})`,
          debit: payment.amount_received,
          credit: 0,
        },
      ]);
    }
  };

  // Receipt Memos Handlers
  const handleAddReceipt = (rec: Omit<PaymentReceipt, 'id'>) => {
    const newRec: PaymentReceipt = { ...rec, id: Date.now() };
    setReceipts((prev) => [newRec, ...prev]);

    // If receipt has associated invoice, update invoice paid amount
    if (rec.invoice_no) {
      const matched = invoices.find(
        (i) => i.invoice_no.toLowerCase() === rec.invoice_no!.toLowerCase()
      );
      if (matched) {
        const prevPaid = matched.paid_amount || 0;
        const newPaid = prevPaid + rec.amount_received;
        const newDue = Math.max(0, matched.grand_total - newPaid);
        const newStatus = newDue <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === matched.id
              ? {
                  ...i,
                  paid_amount: newPaid,
                  due_amount: newDue,
                  status: newStatus,
                }
              : i
          )
        );
      }
    }

    // If deposited to bank, record in Bank Ledger
    if (rec.bank_id && rec.payment_mode !== 'Cash') {
      setBankTransactions((prev) => [
        ...prev,
        {
          id: Date.now() + 60,
          bank_id: rec.bank_id!,
          trans_date: rec.receipt_date,
          description: `Payment Receipt: ${rec.customer_name} (${rec.receipt_no} - ${rec.payment_mode})`,
          debit: rec.amount_received,
          credit: 0,
        },
      ]);
    }
  };

  const handleUpdateReceipt = (id: number, updated: Partial<PaymentReceipt>) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  const handleDeleteReceipt = (id: number) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  // Office Expenses
  const handleAddOfficeExpense = (exp: Omit<OfficeExpense, 'id'>) => {
    const newExp: OfficeExpense = { ...exp, id: Date.now() };
    setOfficeExpenses((prev) => [newExp, ...prev]);

    // If paid via bank, record bank transaction automatically
    if (exp.bank_id && exp.payment_method !== 'Cash / Petty Cash') {
      setBankTransactions((prev) => [
        ...prev,
        {
          id: Date.now() + 10,
          bank_id: exp.bank_id!,
          trans_date: exp.expense_date,
          description: `Office Expense: ${exp.category} - ${exp.description}`,
          debit: 0,
          credit: exp.amount,
        },
      ]);
    }
  };

  const handleUpdateOfficeExpense = (id: number, updated: Partial<OfficeExpense>) => {
    setOfficeExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
  };

  const handleDeleteOfficeExpense = (id: number) => {
    setOfficeExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Project & Project Expenses
  const handleAddProject = (p: Omit<Project, 'id'>) => {
    setProjects((prev) => [...prev, { ...p, id: Date.now() }]);
  };

  const handleAddProjectExpense = (exp: Omit<ProjectExpense, 'id'>) => {
    const newExp: ProjectExpense = { ...exp, id: Date.now() };
    setProjectExpenses((prev) => [newExp, ...prev]);

    // If paid via bank, record bank credit transaction
    if (exp.bank_id && exp.payment_method !== 'Cash / Petty Cash') {
      setBankTransactions((prev) => [
        ...prev,
        {
          id: Date.now() + 20,
          bank_id: exp.bank_id!,
          trans_date: exp.expense_date,
          description: `Project Expense (${exp.project_name || 'Site'}): ${exp.expense_type} - ${exp.description}`,
          debit: 0,
          credit: exp.amount,
        },
      ]);
    }
  };

  const handleUpdateProjectExpense = (
    id: number,
    updated: Partial<ProjectExpense>
  ) => {
    setProjectExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
  };

  const handleDeleteProjectExpense = (id: number) => {
    setProjectExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const lowStockCount = products.filter(
    (p) => p.current_stock <= p.reorder_level
  ).length;

  // Security Gate: Password Required to Open Accounts
  if (!isAuthenticated) {
    return <AuthLockScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 antialiased">
      {/* Sidebar with Expense Sheet Dropdown, Receipt Memos & Lock action */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        officeExpenseCount={officeExpenses.length}
        projectExpenseCount={projectExpenses.length}
        lowStockCount={lowStockCount}
        totalBanksCount={banks.length}
        receiptsCount={receipts.length}
        cloudSyncStatus={cloudSyncStatus}
        lastSyncTime={lastSyncTime}
        onForceSync={handleForceSync}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onLock={() => {
          sessionStorage.removeItem('trendz_auth_unlocked');
          setIsAuthenticated(false);
        }}
      />

      {/* Main Content Area (offset by 256px on desktop) */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'banks' && (
            <BankStatementsView
              banks={banks}
              bankTransactions={bankTransactions}
              onAddTransaction={handleAddBankTx}
              onUpdateTransaction={handleUpdateBankTx}
              onDeleteTransaction={handleDeleteBankTx}
            />
          )}

          {activeTab === 'manage_banks' && (
            <ManageBanksView
              banks={banks}
              onAddBank={handleAddBank}
              onDeleteBank={handleDeleteBank}
            />
          )}

          {activeTab === 'bank_dashboard' && (
            <BankDashboardView banks={banks} bankTransactions={bankTransactions} />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              customers={customers}
              products={products}
              banks={banks}
              onSaveInvoice={handleSaveInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onReceivePayment={handleReceiveInvoicePayment}
              onOpenWhatsApp={(msg) => setWhatsAppMsg(msg)}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptMemosView
              receipts={receipts}
              customers={customers}
              invoices={invoices}
              banks={banks}
              onAddReceipt={handleAddReceipt}
              onUpdateReceipt={handleUpdateReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              onOpenWhatsApp={(msg) => setWhatsAppMsg(msg)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'vendors' && (
            <VendorsView
              vendors={vendors}
              vendorTransactions={vendorTransactions}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
              onAddVendorTransaction={handleAddVendorTx}
              onUpdateVendorTransaction={handleUpdateVendorTx}
              onDeleteVendorTransaction={handleDeleteVendorTx}
              onOpenWhatsApp={(msg) => setWhatsAppMsg(msg)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              stockMovements={stockMovements}
              vendors={vendors}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeTab === 'office_expenses' && (
            <OfficeExpensesView
              expenses={officeExpenses}
              banks={banks}
              onAddExpense={handleAddOfficeExpense}
              onUpdateExpense={handleUpdateOfficeExpense}
              onDeleteExpense={handleDeleteOfficeExpense}
              onOpenWhatsApp={(msg) => setWhatsAppMsg(msg)}
            />
          )}

          {activeTab === 'project_expenses' && (
            <ProjectExpensesView
              projects={projects}
              projectExpenses={projectExpenses}
              banks={banks}
              onAddProjectExpense={handleAddProjectExpense}
              onUpdateProjectExpense={handleUpdateProjectExpense}
              onDeleteProjectExpense={handleDeleteProjectExpense}
              onAddProject={handleAddProject}
              onOpenWhatsApp={(msg) => setWhatsAppMsg(msg)}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreView
              currentData={{
                banks,
                bankTransactions,
                customers,
                vendors,
                vendorTransactions,
                products,
                stockMovements,
                invoices,
                receipts,
                officeExpenses,
                projects,
                projectExpenses,
                masterPassword: localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123',
              }}
              onRestoreData={handleRestoreData}
              cloudSyncStatus={cloudSyncStatus}
              lastSyncTime={lastSyncTime}
              onForceSync={handleForceSync}
            />
          )}
        </div>
      </main>

      {/* WhatsApp Message Preview Modal */}
      <WhatsAppModal
        message={whatsAppMsg}
        onClose={() => setWhatsAppMsg(null)}
      />

      {/* Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentData={{
          banks,
          bankTransactions,
          customers,
          vendors,
          vendorTransactions,
          products,
          stockMovements,
          invoices,
          receipts,
          officeExpenses,
          projects,
          projectExpenses,
          masterPassword: localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123',
        }}
        onRestoreData={handleRestoreData}
      />
    </div>
  );
}
