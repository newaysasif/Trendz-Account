import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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

export interface AppDataPayload {
  banks: Bank[];
  bankTransactions: BankTransaction[];
  customers: Customer[];
  vendors: Vendor[];
  vendorTransactions: VendorTransaction[];
  products: Product[];
  stockMovements: StockMovement[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  officeExpenses: OfficeExpense[];
  projects: Project[];
  projectExpenses: ProjectExpense[];
  masterPassword?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

const DOC_COLLECTION = 'trendz_erp';
const DOC_ID = 'live_company_data';

// Helper to remove any undefined values so Firestore doesn't reject them
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Subscribes to real-time updates from Firebase Firestore.
 */
export function subscribeToCloudData(
  onDataReceived: (data: Partial<AppDataPayload>) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, DOC_COLLECTION, DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppDataPayload;
        onDataReceived(data);
      } else {
        // Document does not exist yet; will be created on first sync
      }
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves current ERP state to Cloud Firestore
 */
export async function saveToCloudData(payload: AppDataPayload): Promise<boolean> {
  try {
    const docRef = doc(db, DOC_COLLECTION, DOC_ID);
    const cleanPayload = sanitizeForFirestore({
      ...payload,
      lastUpdated: new Date().toISOString(),
    });
    await setDoc(docRef, cleanPayload, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save data to Firestore:', error);
    return false;
  }
}

/**
 * Fetches one-time current Cloud Firestore data
 */
export async function fetchCurrentCloudData(): Promise<AppDataPayload | null> {
  try {
    const docRef = doc(db, DOC_COLLECTION, DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppDataPayload;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch from Firestore:', error);
    return null;
  }
}
